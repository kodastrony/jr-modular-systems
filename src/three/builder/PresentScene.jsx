/* PRESENT MODE — heavy, photoreal visualisation built from the grid plan. */
import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useThree, invalidate } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import PresentModule from './PresentModule.jsx'
import { claddingTex, tiled } from '../textures.js'
import {
  CELL, MODULE_H, FLOOR_H, FOUNDATION_H, buildBounds, claddingById, cellKey,
  roofRectangles, exposedTopCells, bayWorld, bayKey, solarWorld, solarKey,
  terraceWorld, terraceKey, DOOR, WINDOW,
} from '../../data/builder.js'

/* one shared transmission glass for the whole scene (single render pass) */
let _glass = null
function sharedGlass() {
  if (_glass) return _glass
  _glass = new THREE.MeshPhysicalMaterial({
    color: '#eaf3f8', metalness: 0, roughness: 0.08,
    transmission: 0.86, thickness: 0.4, ior: 1.45, transparent: true,
    clearcoat: 0.4, clearcoatRoughness: 0.06, envMapIntensity: 1.6,
  })
  return _glass
}

function useMats() {
  const mats = useMemo(() => ({
    cast: new THREE.MeshStandardMaterial({ color: '#202327', roughness: 0.5, metalness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: 0.45, metalness: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: '#34383d', roughness: 0.5, metalness: 0.4 }),
    floorPan: new THREE.MeshStandardMaterial({ color: '#1a1c1f', roughness: 0.9, metalness: 0.2 }),
    interior: new THREE.MeshStandardMaterial({ color: '#3a3f48', roughness: 0.92, metalness: 0.05 }),
    roof: new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.7, metalness: 0.35 }),
    plinth: new THREE.MeshStandardMaterial({ color: '#33363b', roughness: 0.92, metalness: 0.1 }),
    solar: new THREE.MeshStandardMaterial({ color: '#13233f', roughness: 0.25, metalness: 0.6 }),
    deck: new THREE.MeshStandardMaterial({ color: '#9c7a52', roughness: 0.75, metalness: 0.05 }),
    glass: sharedGlass(),
  }), [])
  // free GPU memory on unmount (present → build) — glass is a shared singleton
  useEffect(() => () => {
    for (const [k, m] of Object.entries(mats)) if (k !== 'glass' && m?.dispose) m.dispose()
  }, [mats])
  return mats
}

function useBodies(cladding) {
  return useMemo(() => {
    const clad = claddingById[cladding] || claddingById.graphite
    const k = clad.kind
    const make = (lengthM) => {
      const pair = claddingTex(k)
      const rx = k === 'wood' ? 1.1 : lengthM * 2.0
      const ry = k === 'wood' ? MODULE_H * 1.4 : 1
      const map = tiled(pair.map, rx, ry); map.colorSpace = THREE.SRGBColorSpace
      const bump = tiled(pair.bump, rx, ry)
      return new THREE.MeshStandardMaterial({
        map, bumpMap: bump,
        bumpScale: k === 'corrugated' ? 0.05 : k === 'panel' ? 0.04 : k === 'wood' ? 0.03 : 0.012,
        color: clad.color,
        roughness: k === 'render' ? 0.9 : k === 'wood' ? 0.72 : 0.42,
        metalness: k === 'corrugated' || k === 'panel' ? 0.5 : 0.06,
        envMapIntensity: 0.9,
      })
    }
    return { m20: make(6), m40: make(12) }
  }, [cladding])
}

/* ---- building-level roof: only over EXPOSED columns (nothing roofed under a
   module above). flat / parapet / gable, per maximal roof rectangle. ---- */
function boundaryEdges(cellSet) {
  const dirs = [[1, 0, 'xp'], [-1, 0, 'xm'], [0, 1, 'zp'], [0, -1, 'zm']]
  const edges = []
  for (const k of cellSet) {
    const i = k.indexOf(','); const x = +k.slice(0, i), z = +k.slice(i + 1)
    for (const [dx, dz, side] of dirs) {
      if (!cellSet.has(cellKey(x + dx, z + dz))) edges.push({ x, z, side })
    }
  }
  return edges
}

function RoofLayer({ modules, type, mats }) {
  const rects = useMemo(() => roofRectangles(modules), [modules])
  const byLevel = useMemo(() => exposedTopCells(modules), [modules])

  return (
    <group>
      {rects.map((r, i) => {
        if (type === 'gable') {
          const short = Math.min(r.sx, r.sz)
          const long = Math.max(r.sx, r.sz)
          const ridgeAlongX = r.sx >= r.sz
          const rise = Math.min(short * 0.4, 1.4)
          const ang = Math.atan2(rise, short / 2)
          const slant = Math.hypot(short / 2, rise)
          return (
            <group key={i} position={[r.cx, r.y + 0.04, r.cz]} rotation={[0, ridgeAlongX ? 0 : Math.PI / 2, 0]}>
              <mesh position={[0, rise / 2, long / 4 * 0 + short / 4]} rotation={[ang, 0, 0]} castShadow material={mats.roof}><boxGeometry args={[long + 0.16, 0.1, slant + 0.06]} /></mesh>
              <mesh position={[0, rise / 2, -short / 4]} rotation={[-ang, 0, 0]} castShadow material={mats.roof}><boxGeometry args={[long + 0.16, 0.1, slant + 0.06]} /></mesh>
              <mesh position={[0, rise + 0.02, 0]} material={mats.cast}><boxGeometry args={[long + 0.18, 0.07, 0.09]} /></mesh>
            </group>
          )
        }
        // flat + parapet share the slab
        return <mesh key={i} position={[r.cx, r.y + 0.05, r.cz]} material={mats.roof} castShadow receiveShadow><boxGeometry args={[r.sx + 0.06, 0.1, r.sz + 0.06]} /></mesh>
      })}

      {/* parapet on the true roof outline (per storey) */}
      {type === 'parapet' && [...byLevel.entries()].flatMap(([level, cells]) => {
        const y = FOUNDATION_H + level * FLOOR_H + MODULE_H
        return boundaryEdges(cells).map((e, j) => {
          const horiz = e.side === 'zp' || e.side === 'zm'
          const px = (e.x + 0.5) * CELL + (e.side === 'xp' ? CELL / 2 : e.side === 'xm' ? -CELL / 2 : 0)
          const pz = (e.z + 0.5) * CELL + (e.side === 'zp' ? CELL / 2 : e.side === 'zm' ? -CELL / 2 : 0)
          return (
            <mesh key={level + '-' + j} position={[px, y + 0.28, pz]} material={mats.frame}>
              <boxGeometry args={horiz ? [CELL + 0.06, 0.46, 0.09] : [0.09, 0.46, CELL + 0.06]} />
            </mesh>
          )
        })
      })}
    </group>
  )
}

/* ---- client-placed openings (true-to-size, on the exact bays) ---- */
function PDoor({ mats }) {
  const w = DOOR.w, h = DOOR.h, cy = h / 2
  return (
    <group position={[0, cy, 0]}>
      <mesh material={mats.interior} position={[0, 0, -0.04]}><boxGeometry args={[w + 0.02, h, 0.06]} /></mesh>
      <mesh material={mats.frame} position={[0, 0, 0.01]}><boxGeometry args={[w + 0.14, h + 0.08, 0.07]} /></mesh>
      <mesh material={mats.door} position={[0, 0, 0.04]}><boxGeometry args={[w, h - 0.04, 0.05]} /></mesh>
      <mesh material={mats.glass} position={[0, h * 0.2, 0.06]}><boxGeometry args={[w * 0.62, h * 0.32, 0.02]} /></mesh>
      <mesh material={mats.cast} position={[w * 0.32, 0, 0.08]}><boxGeometry args={[0.05, 0.26, 0.05]} /></mesh>
    </group>
  )
}
function PWindow({ mats }) {
  const w = WINDOW.w, h = WINDOW.h, cy = WINDOW.sill + h / 2
  return (
    <group position={[0, cy, 0]}>
      <mesh material={mats.interior} position={[0, 0, -0.04]}><boxGeometry args={[w + 0.02, h + 0.02, 0.06]} /></mesh>
      <mesh material={mats.frame} position={[0, 0, 0.01]}><boxGeometry args={[w + 0.12, h + 0.12, 0.07]} /></mesh>
      <mesh material={mats.glass} position={[0, 0, 0.04]}><boxGeometry args={[w, h, 0.03]} /></mesh>
      <mesh material={mats.frame} position={[0, 0, 0.055]}><boxGeometry args={[0.04, h, 0.04]} /></mesh>
      <mesh material={mats.frame} position={[0, -h / 2 - 0.05, 0.06]}><boxGeometry args={[w + 0.18, 0.08, 0.12]} /></mesh>
    </group>
  )
}
function OpeningsLayer({ openings, mats }) {
  return openings.map((o) => {
    const bw = bayWorld(o)
    return (
      <group key={bayKey(o)} position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]}>
        {o.type === 'door' ? <PDoor mats={mats} /> : <PWindow mats={mats} />}
      </group>
    )
  })
}

/* ---- client-placed solar panels (on the exact roof cells) ---- */
function SolarLayer({ solar, mats }) {
  return solar.map((c) => {
    const w = solarWorld(c)
    return (
      <mesh key={solarKey(c)} position={[w.cx, w.y + 0.11, w.cz]} rotation={[-0.34, 0, 0]} material={mats.solar} castShadow>
        <boxGeometry args={[CELL * 0.92, 0.05, CELL * 0.92]} />
      </mesh>
    )
  })
}

/* ---- client-placed terrace deck (on the exact ground cells) ---- */
function TerraceLayer({ terrace, mats }) {
  return terrace.map((c) => {
    const w = terraceWorld(c)
    return (
      <mesh key={terraceKey(c)} position={[w.cx, w.y - 0.05, w.cz]} material={mats.deck} receiveShadow castShadow>
        <boxGeometry args={[CELL, 0.14, CELL]} />
      </mesh>
    )
  })
}

function CaptureBridge({ captureRef }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!captureRef) return
    captureRef.current = () => { gl.render(scene, camera); return gl.domElement.toDataURL('image/png') }
    return () => { if (captureRef) captureRef.current = null }
  }, [gl, scene, camera, captureRef])
  return null
}

/* one-shot intro orbit, then idle (demand frameloop) */
function IntroSpin({ controls }) {
  useEffect(() => {
    let raf, started = null
    const tick = (now) => {
      if (started === null) started = now
      const t = (now - started) / 1000
      if (controls.current && t < 3.2) {
        const e = 1 - t / 3.2
        controls.current.setAzimuthalAngle(controls.current.getAzimuthalAngle() - 0.006 * e)
        controls.current.update(); invalidate()
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [controls])
  return null
}

function PresentCamera({ controls, apiRef, bounds }) {
  const { camera } = useThree()
  const [cx, cz] = bounds.center
  const frame = useCallback((kind = 'iso') => {
    const c = controls.current
    if (!c) return
    const span = Math.max(bounds.size[0], bounds.size[1], 8)
    const dist = span * 1.5 + 10 + bounds.height
    const ty = bounds.height * 0.42
    c.target.set(cx, ty, cz)
    if (kind === 'top') camera.position.set(cx + 0.01, ty + dist * 1.2, cz)
    else if (kind === 'front') camera.position.set(cx, ty + bounds.height * 0.4, cz + dist)
    else camera.position.set(cx + dist * 0.7, ty + dist * 0.62, cz + dist * 0.7)
    camera.updateProjectionMatrix(); c.update(); invalidate()
  }, [bounds, camera, controls, cx, cz])

  useEffect(() => {
    if (apiRef) apiRef.current = { fit: () => frame('iso'), top: () => frame('top'), front: () => frame('front'), iso: () => frame('iso') }
    return () => { if (apiRef) apiRef.current = null }
  }, [apiRef, frame])

  const did = useRef(false)
  useEffect(() => { if (!did.current) { did.current = true; frame('iso') } }, [frame])
  return null
}

export default function PresentScene({ modules, openings = [], solar = [], terrace = [], finish, captureRef, cameraApiRef }) {
  const controls = useRef()
  const mats = useMats()
  const bodies = useBodies(finish?.cladding)
  const bounds = useMemo(() => buildBounds(modules), [modules])

  // dispose cladding bodies when they change
  useEffect(() => () => { bodies.m20?.dispose(); bodies.m40?.dispose() }, [bodies])

  const [cx, cz] = bounds.center
  const groundR = Math.max(60, Math.max(bounds.size[0], bounds.size[1]) * 3)

  return (
    <group>
      <hemisphereLight args={['#eef3f8', '#5a5f54', 0.75]} />
      <directionalLight
        position={[cx + 26, 34, cz + 18]} intensity={2.7} color="#fff6ea" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={1} shadow-camera-far={140}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[cx - 18, 14, cz + 22]} intensity={0.9} color="#eaf1f8" />
      <ambientLight intensity={0.42} />

      {/* ground — clean concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[groundR * 2, groundR * 2]} />
        <meshStandardMaterial color="#bcc0c5" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* bare container bodies */}
      {modules.map((m) => <PresentModule key={m.id} mod={m} mats={mats} body={bodies[m.type]} />)}

      {/* building-level roof — only over exposed columns (never under a stacked module) */}
      <RoofLayer modules={modules} type={finish?.roof || 'flat'} mats={mats} />

      {/* client-placed add-ons, rendered exactly where they were designed */}
      <OpeningsLayer openings={openings} mats={mats} />
      <SolarLayer solar={solar} mats={mats} />
      <TerraceLayer terrace={terrace} mats={mats} />

      <ContactShadows position={[0, FOUNDATION_H * 0.5, 0]} scale={groundR} blur={2.4} far={18} opacity={0.5} resolution={1024} color="#0a0c10" />

      <Environment resolution={256} environmentIntensity={0.65}>
        {[[-30, -18], [0, -18], [30, -18], [-30, 18], [30, 18]].map(([x, z], i) => (
          <Lightformer key={i} intensity={1.4} form="rect" position={[x, 30, z]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 10, 1]} color="#ffffff" />
        ))}
        <Lightformer intensity={0.7} form="rect" position={[0, 12, 50]} scale={[40, 20, 1]} color="#dfeaf6" />
      </Environment>

      <PresentCamera controls={controls} apiRef={cameraApiRef} bounds={bounds} />
      <IntroSpin controls={controls} />
      <CaptureBridge captureRef={captureRef} />

      <OrbitControls
        ref={controls} makeDefault enablePan enableDamping dampingFactor={0.1}
        minDistance={6} maxDistance={groundR * 1.4}
        minPolarAngle={Math.PI * 0.08} maxPolarAngle={Math.PI * 0.49}
        target={[cx, bounds.height * 0.42, cz]} zoomToCursor onChange={() => invalidate()}
      />
    </group>
  )
}
