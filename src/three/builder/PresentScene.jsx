/* PRESENT MODE — heavy, photoreal visualisation built from the grid plan. */
import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useThree, invalidate } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import PresentModule from './PresentModule.jsx'
import { claddingTex, tiled, getTextures } from '../textures.js'
import {
  CELL, MODULE_H, FLOOR_H, FOUNDATION_H, buildBounds, claddingById, cellKey,
  roofRectangles, exposedTopCells, bayWorld, bayKey, solarKey,
  terraceWorld, terraceKey, DOOR, WINDOW,
} from '../../data/builder.js'

/* one shared transmission glass for the whole scene (single render pass) */
let _glass = null
function sharedGlass() {
  if (_glass) return _glass
  // real glazing reads dark with a cool sky reflection — not a glowing white pane.
  // lower transmission + a deeper slate tint let the dark interior show through.
  _glass = new THREE.MeshPhysicalMaterial({
    color: '#3f5663', metalness: 0, roughness: 0.05,
    transmission: 0.55, thickness: 0.5, ior: 1.5, transparent: true,
    clearcoat: 0.7, clearcoatRoughness: 0.04, envMapIntensity: 1.5, reflectivity: 0.6,
  })
  return _glass
}

function useMats() {
  const mats = useMemo(() => {
    const tex = getTextures()
    const deckMap = tex.deck.map.clone(); deckMap.colorSpace = THREE.SRGBColorSpace; deckMap.needsUpdate = true
    const deckBump = tex.deck.bump.clone(); deckBump.needsUpdate = true
    const pvMap = tex.solar.clone(); pvMap.colorSpace = THREE.SRGBColorSpace; pvMap.needsUpdate = true
    // standing-seam map runs UP the slope; tile along the ridge (~0.6 m pans)
    const seamMap = tiled(tex.roofseam.map, 16, 1); seamMap.colorSpace = THREE.SRGBColorSpace
    const seamBump = tiled(tex.roofseam.bump, 16, 1)
    return ({
    // ISO corner castings — forged cast-steel, a touch darker & more metallic than trim
    cast: new THREE.MeshStandardMaterial({ color: '#3a3e44', roughness: 0.48, metalness: 0.8, envMapIntensity: 0.9 }),
    // frame rails / corner posts — mid-charcoal trim (reads as slim trim, NOT a black cage).
    // a polygon offset makes them win the depth test over the cladding box → no z-fight flicker
    frame: new THREE.MeshStandardMaterial({ color: '#4a4e54', roughness: 0.45, metalness: 0.5, envMapIntensity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    door: new THREE.MeshStandardMaterial({ color: '#41454b', roughness: 0.4, metalness: 0.35, envMapIntensity: 0.8 }),
    floorPan: new THREE.MeshStandardMaterial({ color: '#1f2226', roughness: 0.9, metalness: 0.2 }),
    interior: new THREE.MeshStandardMaterial({ color: '#3f444c', roughness: 0.95, metalness: 0.03 }),
    // flat-roof / parapet-top membrane (clean neutral TPO/PVC grey)
    roof: new THREE.MeshStandardMaterial({ color: '#54585e', roughness: 0.78, metalness: 0.12, envMapIntensity: 0.6 }),
    // pitched standing-seam metal sheet (gable) — darker crisp anthracite with seams
    roofPanel: new THREE.MeshStandardMaterial({ color: '#494e55', map: seamMap, bumpMap: seamBump, bumpScale: 0.05, roughness: 0.5, metalness: 0.45, envMapIntensity: 0.95 }),
    // parapet coping cap — lightest hardware tone, draws a clean line round the attyka
    coping: new THREE.MeshStandardMaterial({ color: '#6a6e74', roughness: 0.42, metalness: 0.55, envMapIntensity: 1.0 }),
    // concrete foundation plinth
    plinth: new THREE.MeshStandardMaterial({ color: '#4f5358', roughness: 0.96, metalness: 0.04 }),
    // monocrystalline PV module — baked alu-frame+cell map (white colour reads it
    // true); low-rough metallic + env reflection supplies the blue glass sheen
    solar: new THREE.MeshStandardMaterial({ color: '#ffffff', map: pvMap, roughness: 0.24, metalness: 0.55, envMapIntensity: 1.3 }),
    // mill-finish aluminium PV mounting rail
    pvFrame: new THREE.MeshStandardMaterial({ color: '#8a9098', roughness: 0.4, metalness: 0.75, envMapIntensity: 1.0 }),
    // wood / composite terrace decking — warm tint × neutral plank map
    deck: new THREE.MeshStandardMaterial({ color: '#b0824f', map: deckMap, bumpMap: deckBump, bumpScale: 0.025, roughness: 0.7, metalness: 0.04, envMapIntensity: 0.4 }),
    glass: sharedGlass(),
  })
  }, [])
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
      // real corrugation pitch ≈ 0.28 m (canvas = 22 ribs ≈ 6.16 m / tile) → rx ≈ length/6.16;
      // wood boards ≈ 0.17 m tall (canvas = 7 boards over height·ry) → ry ≈ 2.2
      const rx = k === 'wood' ? Math.max(1, lengthM / 5.5) : lengthM / 6.16
      const ry = k === 'wood' ? 2.2 : 1
      const map = tiled(pair.map, rx, ry); map.colorSpace = THREE.SRGBColorSpace
      const bump = tiled(pair.bump, rx, ry)
      return new THREE.MeshStandardMaterial({
        map, bumpMap: bump,
        bumpScale: k === 'corrugated' ? 0.055 : k === 'panel' ? 0.04 : k === 'wood' ? 0.04 : 0.02,
        color: clad.color,
        // painted-steel sheen (low-ish metalness, soft-sky env) keeps colours true
        // while giving anthracite/white a believable surface; timber is matte dielectric
        roughness: k === 'render' ? 0.92 : k === 'wood' ? 0.68 : 0.5,
        metalness: k === 'corrugated' || k === 'panel' ? 0.35 : 0.04,
        envMapIntensity: k === 'wood' || k === 'render' ? 0.45 : 0.85,
      })
    }
    return { m20: make(6.1), m40: make(12.2) }
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

/* shared gable pitch — RoofLayer (the slopes) and solarPlacement (panels on the
   pitch) MUST derive the rise from the same formula, or panels tilt off the roof */
const gableRise = (short) => Math.min(short * 0.42, 1.5)

function RoofLayer({ modules, type, mats, cladColor }) {
  const rects = useMemo(() => roofRectangles(modules), [modules])
  const byLevel = useMemo(() => exposedTopCells(modules), [modules])
  // cladding-matched material — gable-end walls + the parapet (attyka) upstand,
  // so a pitched/parapet roof always reads as part of the same building.
  const cladMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: cladColor || '#5a5f66', roughness: 0.6, metalness: 0.18, envMapIntensity: 0.6, side: THREE.DoubleSide }),
    [cladColor]
  )
  useEffect(() => () => cladMat.dispose(), [cladMat])

  const PARAPET_H = 0.42        // attyka upstand height above the roof
  const EAVE = 0.28             // gable eaves overhang past the walls

  return (
    <group>
      {rects.map((r, i) => {
        if (type === 'gable') {
          const short = Math.min(r.sx, r.sz)
          const long = Math.max(r.sx, r.sz)
          const ridgeAlongX = r.sx >= r.sz
          const rise = gableRise(short)
          const ang = Math.atan2(rise, short / 2)
          const slant = Math.hypot(short / 2, rise)
          const eaveSlant = EAVE / Math.cos(ang)   // overhang measured along the pitch
          // triangular gable-end walls close the attic so it never reads as hollow
          const endShape = new THREE.Shape()
          endShape.moveTo(-short / 2, -0.04); endShape.lineTo(short / 2, -0.04); endShape.lineTo(0, rise); endShape.closePath()
          const panelLen = slant + eaveSlant   // sloped panel incl. eaves overhang
          const cz0 = short / 4                 // centre of each half-pitch in Z
          return (
            <group key={i} position={[r.cx, r.y, r.cz]} rotation={[0, ridgeAlongX ? 0 : Math.PI / 2, 0]}>
              {/* two metal slopes (anthracite standing-seam look), overhanging the eaves + gables */}
              <mesh position={[0, rise / 2, cz0]} rotation={[ang, 0, 0]} castShadow receiveShadow material={mats.roofPanel}><boxGeometry args={[long + 2 * EAVE, 0.08, panelLen]} /></mesh>
              <mesh position={[0, rise / 2, -cz0]} rotation={[-ang, 0, 0]} castShadow receiveShadow material={mats.roofPanel}><boxGeometry args={[long + 2 * EAVE, 0.08, panelLen]} /></mesh>
              {/* ridge cap */}
              <mesh position={[0, rise + 0.03, 0]} castShadow material={mats.coping}><boxGeometry args={[long + 2 * EAVE + 0.04, 0.1, 0.16]} /></mesh>
              {/* fascia boards along both eaves */}
              <mesh position={[0, -0.02, short / 2 + EAVE]} material={mats.coping}><boxGeometry args={[long + 2 * EAVE, 0.13, 0.04]} /></mesh>
              <mesh position={[0, -0.02, -(short / 2 + EAVE)]} material={mats.coping}><boxGeometry args={[long + 2 * EAVE, 0.13, 0.04]} /></mesh>
              {/* gable-end triangles in the cladding colour */}
              <mesh position={[long / 2 - 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={cladMat} castShadow receiveShadow><shapeGeometry args={[endShape]} /></mesh>
              <mesh position={[-(long / 2 - 0.02), 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={cladMat} castShadow receiveShadow><shapeGeometry args={[endShape]} /></mesh>
            </group>
          )
        }
        // flat + parapet share the membrane slab — lifted clear of the module top rail
        return <mesh key={i} position={[r.cx, r.y + 0.085, r.cz]} material={mats.roof} castShadow receiveShadow><boxGeometry args={[r.sx + 0.04, 0.09, r.sz + 0.04]} /></mesh>
      })}

      {/* parapet (attyka): a low cladding upstand + a bright metal coping cap, on the
          true roof outline (per storey) — reads as a real parapet, not a black band */}
      {type === 'parapet' && [...byLevel.entries()].flatMap(([level, cells]) => {
        const y = FOUNDATION_H + level * FLOOR_H + MODULE_H
        return boundaryEdges(cells).map((e, j) => {
          const horiz = e.side === 'zp' || e.side === 'zm'
          const px = (e.x + 0.5) * CELL + (e.side === 'xp' ? CELL / 2 : e.side === 'xm' ? -CELL / 2 : 0)
          const pz = (e.z + 0.5) * CELL + (e.side === 'zp' ? CELL / 2 : e.side === 'zm' ? -CELL / 2 : 0)
          const wall = horiz ? [CELL + 0.04, PARAPET_H, 0.1] : [0.1, PARAPET_H, CELL + 0.04]
          const cap = horiz ? [CELL + 0.12, 0.06, 0.16] : [0.16, 0.06, CELL + 0.12]
          return (
            <group key={level + '-' + j}>
              <mesh position={[px, y + PARAPET_H / 2, pz]} material={cladMat} castShadow receiveShadow><boxGeometry args={wall} /></mesh>
              <mesh position={[px, y + PARAPET_H + 0.01, pz]} material={mats.coping} castShadow><boxGeometry args={cap} /></mesh>
            </group>
          )
        })
      })}
    </group>
  )
}

/* ---- client-placed openings (true-to-size, on the exact bays) ----
   frameMat / doorMat are family-aware (see openingMaterials): white PVC frame on
   light/wood walls, anthracite on graphite; anthracite door leaf, or timber on wood. */
function PDoor({ mats, frameMat, doorMat }) {
  const w = DOOR.w, h = DOOR.h, cy = h / 2
  return (
    <group position={[0, cy, 0]}>
      {/* dark reveal so the opening reads as real depth */}
      <mesh material={mats.interior} position={[0, 0, -0.05]}><boxGeometry args={[w + 0.02, h, 0.05]} /></mesh>
      {/* outer frame, slightly proud of the wall */}
      <mesh material={frameMat} position={[0, 0.01, 0.03]}><boxGeometry args={[w + 0.12, h + 0.09, 0.08]} /></mesh>
      {/* leaf */}
      <mesh material={doorMat} position={[0, 0, 0.05]}><boxGeometry args={[w - 0.02, h - 0.03, 0.05]} /></mesh>
      {/* glazed upper light */}
      <mesh material={mats.glass} position={[0, h * 0.22, 0.075]}><boxGeometry args={[w * 0.66, h * 0.34, 0.015]} /></mesh>
      {/* rail dividing glazed top from solid bottom */}
      <mesh material={frameMat} position={[0, h * 0.02, 0.078]}><boxGeometry args={[w - 0.02, 0.045, 0.02]} /></mesh>
      {/* vertical pull handle on the latch side */}
      <mesh material={mats.cast} position={[w * 0.34, -h * 0.04, 0.09]}><boxGeometry args={[0.04, 0.42, 0.045]} /></mesh>
      {/* threshold */}
      <mesh material={mats.cast} position={[0, -h / 2 + 0.01, 0.04]}><boxGeometry args={[w + 0.12, 0.04, 0.1]} /></mesh>
    </group>
  )
}
function PWindow({ mats, frameMat }) {
  const w = WINDOW.w, h = WINDOW.h, cy = WINDOW.sill + h / 2
  return (
    <group position={[0, cy, 0]}>
      {/* dark reveal behind the glazing */}
      <mesh material={mats.interior} position={[0, 0, -0.05]}><boxGeometry args={[w + 0.02, h + 0.02, 0.05]} /></mesh>
      {/* outer frame */}
      <mesh material={frameMat} position={[0, 0, 0.025]}><boxGeometry args={[w + 0.1, h + 0.1, 0.075]} /></mesh>
      {/* glass, recessed slightly inside the frame */}
      <mesh material={mats.glass} position={[0, 0, 0.01]}><boxGeometry args={[w, h, 0.02]} /></mesh>
      {/* central mullion + transom → clean four-pane division */}
      <mesh material={frameMat} position={[0, 0, 0.05]}><boxGeometry args={[0.04, h, 0.045]} /></mesh>
      <mesh material={frameMat} position={[0, 0, 0.05]}><boxGeometry args={[w, 0.04, 0.045]} /></mesh>
      {/* protruding sill */}
      <mesh material={frameMat} position={[0, -h / 2 - 0.055, 0.05]}><boxGeometry args={[w + 0.16, 0.06, 0.13]} /></mesh>
    </group>
  )
}
function OpeningsLayer({ openings, mats, frameMat, doorMat }) {
  return openings.map((o) => {
    const bw = bayWorld(o)
    return (
      <group key={bayKey(o)} position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]}>
        {o.type === 'door' ? <PDoor mats={mats} frameMat={frameMat} doorMat={doorMat} /> : <PWindow mats={mats} frameMat={frameMat} />}
      </group>
    )
  })
}

/* Where a solar panel sits, given the roof type. On flat/parapet roofs it rests
   just above the slab with a slight tilt. On a GABLE roof it must lie ON the
   pitch — find the roof rectangle the cell belongs to, work out which slope it is
   on and how high up that slope, and tilt the panel to match the gable angle so
   it never clips into the roof. */
function solarPlacement(cell, rects, roofType) {
  const cx = (cell.x + 0.5) * CELL
  const cz = (cell.z + 0.5) * CELL
  const topY = FOUNDATION_H + cell.floor * FLOOR_H + MODULE_H
  // tilted array on racking (classic flat-roof PV): each module pitched ~16° south,
  // raised so the low edge clears the membrane slab (slab top ≈ topY+0.13)
  const flat = { pos: [cx, topY + 0.3, cz], rot: [-0.28, 0, 0], base: topY + 0.13 }
  if (roofType !== 'gable') return flat

  const r = rects.find((rr) => Math.abs(rr.y - topY) < 0.02
    && Math.abs(cx - rr.cx) <= rr.sx / 2 + 1e-3 && Math.abs(cz - rr.cz) <= rr.sz / 2 + 1e-3)
  if (!r) return flat

  const ridgeAlongX = r.sx >= r.sz          // ridge runs along the longer axis
  const short = Math.min(r.sx, r.sz)
  const rise = gableRise(short)
  const ang = Math.atan2(rise, short / 2)
  const off = ridgeAlongX ? cz - r.cz : cx - r.cx   // signed distance from the ridge
  const side = off >= 0 ? 1 : -1
  const d = Math.min(Math.abs(off), short / 2)
  const y = r.y + 0.04 + rise * (1 - d / (short / 2)) + 0.10 / Math.cos(ang)
  // tilt the panel to lie along the slope (about the ridge axis)
  const rot = ridgeAlongX ? [side * ang, 0, 0] : [0, 0, -side * ang]
  return { pos: [cx, y, cz], rot }
}

/* ---- client-placed solar panels (follow the roof: flat or on the gable pitch) ---- */
function SolarLayer({ solar, modules, roofType, mats }) {
  const rects = useMemo(() => roofRectangles(modules), [modules])
  return solar.map((c) => {
    const t = solarPlacement(c, rects, roofType)
    return (
      <group key={solarKey(c)}>
        {/* low racking pedestal on the membrane (flat roofs only) */}
        {t.base != null && (
          <mesh material={mats.pvFrame} position={[t.pos[0], (t.base + t.pos[1] - 0.04) / 2, t.pos[2]]}>
            <boxGeometry args={[CELL * 0.6, t.pos[1] - 0.04 - t.base, 0.06]} />
          </mesh>
        )}
        <group position={t.pos} rotation={t.rot}>
          {/* thin module: dark cell glass (baked map) on a slim alu tray */}
          <mesh material={mats.solar} castShadow><boxGeometry args={[CELL * 0.99, 0.04, CELL * 0.99]} /></mesh>
          <mesh material={mats.pvFrame} position={[0, -0.028, 0]}><boxGeometry args={[CELL, 0.025, CELL]} /></mesh>
        </group>
      </group>
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
    // respect reduced-motion: skip the auto-orbit entirely
    if (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
    const dist = span * 1.5 + 12 + bounds.height
    const ty = bounds.height * 0.42
    c.target.set(cx, ty, cz)
    if (kind === 'top') camera.position.set(cx + 0.01, ty + dist * 1.2, cz)
    else if (kind === 'front') camera.position.set(cx, ty + bounds.height * 0.34, cz + dist)
    else camera.position.set(cx + dist * 0.82, ty + dist * 0.46, cz + dist * 0.72)
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

/* Clean STUDIO environment for every scene: white radial backdrop, white sweep
   floor, soft studio light, far fog (building always crisp), wide pull-back. The
   only customizable thing is the finite SCENERY square the building stands on. */
const STUDIO = {
  bg: { top: '#e7ebef', horizon: '#ffffff', radial: true },
  fogColor: '#f6f8fb',
  sun: { color: '#fff8f0', intensity: 2.5, pos: [-18, 40, 24] },
  fill: { color: '#eef3fb', intensity: 0.85 },
  hemi: { sky: '#ffffff', ground: '#e7eaee', intensity: 0.82 },
  ambient: 0.56, exposure: 1.09, envIntensity: 1.0,
  floor: { color: '#eef0f1', rough: 0.45, env: 0.9 },
  contact: '#1c2028',
}

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* gradient sky → a CanvasTexture used as scene.background (screen-space backdrop) */
function makeGradientSky(bg) {
  if (typeof document === 'undefined') return null
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S
  const x = c.getContext('2d')
  if (bg.flat) { x.fillStyle = bg.flat; x.fillRect(0, 0, S, S) }
  else if (bg.radial) {
    const g = x.createRadialGradient(S / 2, S * 0.58, 60, S / 2, S * 0.58, S * 0.78)
    g.addColorStop(0, bg.horizon); g.addColorStop(1, bg.top)
    x.fillStyle = g; x.fillRect(0, 0, S, S)
  } else {
    const g = x.createLinearGradient(0, 0, 0, S)
    g.addColorStop(0, bg.top); g.addColorStop(0.6, bg.horizon); g.addColorStop(1, bg.horizon)
    x.fillStyle = g; x.fillRect(0, 0, S, S)
    // faint stars across the upper sky (dusk)
    if (bg.stars) {
      for (let i = 0; i < 150; i++) {
        const sx = Math.random() * S, sy = Math.random() * S * 0.5
        x.fillStyle = `rgba(228,234,244,${0.22 + Math.random() * 0.55})`
        x.beginPath(); x.arc(sx, sy, Math.random() < 0.16 ? 1.6 : 0.85, 0, 7); x.fill()
      }
    }
    // the moon — a soft glow + a bright disc high in the sky (dusk)
    if (bg.moon) {
      const m = bg.moon, mx = m.x * S, my = m.y * S
      const gl = x.createRadialGradient(mx, my, 0, mx, my, m.glow)
      gl.addColorStop(0, hexA(m.color, 0.5)); gl.addColorStop(0.4, hexA(m.color, 0.12)); gl.addColorStop(1, hexA(m.color, 0))
      x.fillStyle = gl; x.fillRect(0, 0, S, S)
      x.fillStyle = m.color; x.beginPath(); x.arc(mx, my, m.r, 0, 7); x.fill()
      // faint mare shading on the disc
      x.fillStyle = hexA('#c9d2e2', 0.25); x.beginPath(); x.arc(mx - m.r * 0.25, my - m.r * 0.2, m.r * 0.28, 0, 7); x.fill()
      x.beginPath(); x.arc(mx + m.r * 0.3, my + m.r * 0.25, m.r * 0.2, 0, 7); x.fill()
    }
    if (bg.glow) {
      const rg = x.createRadialGradient(S * 0.68, S * 0.3, 6, S * 0.68, S * 0.3, S * 0.55)
      rg.addColorStop(0, hexA(bg.glow, 0.6)); rg.addColorStop(1, hexA(bg.glow, 0))
      x.fillStyle = rg; x.fillRect(0, 0, S, S)
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

/* imperatively own the present-mode background, fog + exposure for a scenery.
   Fog distances are scaled to the framing so distant ground fades into the sky
   at a visible horizon (near is past the building, so the building stays crisp). */
function SceneEnvironment({ env, fogNear, fogFar }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const tex = makeGradientSky(env.bg)
    if (tex) scene.background = tex
    scene.fog = env.fogColor ? new THREE.Fog(env.fogColor, fogNear, fogFar) : null
    const prev = gl.toneMappingExposure
    gl.toneMappingExposure = env.exposure
    invalidate()
    return () => { if (tex) tex.dispose(); scene.fog = null; gl.toneMappingExposure = prev }
  }, [gl, scene, env, fogNear, fogFar])
  return null
}

/* the big sweep floor — its colour comes from the BACKGROUND (white studio / light
   ground under sky / dark ground at dusk). Fog dissolves its rim into the backdrop. */
function SweepFloor({ color, rough, env, cx, cz, groundR }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: env }), [color, rough, env])
  useEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow material={mat}>
      <planeGeometry args={[groundR * 2, groundR * 2]} />
    </mesh>
  )
}

export default function PresentScene({ modules, openings = [], solar = [], terrace = [], finish, captureRef, cameraApiRef }) {
  const controls = useRef()
  const mats = useMats()
  const bodies = useBodies(finish?.cladding)
  const bounds = useMemo(() => buildBounds(modules), [modules])

  // realistic dark-aluminium joinery (anthracite RAL 7016 — the standard modern
  // window/door frame; reads premium on every cladding). Door leaf goes warm
  // timber on wood walls, otherwise a deep anthracite leaf.
  const openMats = useMemo(() => {
    const isWood = finish?.cladding === 'wood' || finish?.cladding === 'wood-dark'
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#33373c', roughness: 0.4, metalness: 0.45, envMapIntensity: 0.85,
    })
    const doorMat = new THREE.MeshStandardMaterial({
      color: isWood ? '#6b4528' : '#2f3338',
      roughness: isWood ? 0.6 : 0.38, metalness: isWood ? 0.05 : 0.4, envMapIntensity: 0.8,
    })
    return { frameMat, doorMat }
  }, [finish?.cladding])

  // dispose cladding bodies AND their cloned map/bumpMap textures (Material.dispose
   // does not free its textures) when the cladding changes / on unmount
  useEffect(() => () => {
    for (const m of [bodies.m20, bodies.m40]) {
      m?.map?.dispose(); m?.bumpMap?.dispose(); m?.dispose()
    }
  }, [bodies])
  useEffect(() => () => { openMats.frameMat.dispose(); openMats.doorMat.dispose() }, [openMats])

  const env = STUDIO

  const [cx, cz] = bounds.center
  const span = Math.max(bounds.size[0], bounds.size[1], 8)
  const camDist = span * 1.5 + 12 + bounds.height
  // far fog → the building stays crisp at every zoom on the white backdrop
  const fogNear = camDist * 3
  const fogFar = camDist * 12
  // white sweep-floor radius: past the fog rim (so its edge dissolves into white) but
  // kept under the camera far plane (1200) so depth precision stays high → no flicker
  const groundR = Math.min(Math.max(fogFar * 1.3, 400), 1050)
  const maxCamDist = Math.max(60, Math.max(bounds.size[0], bounds.size[1]) * 3) * 1.4
  // the soft grey grounding "square" size
  const squareSize = Math.max(60, Math.max(bounds.size[0], bounds.size[1]) * 3)
  // halve the shadow map on phones — a 2048² map is a real cost on weak GPUs
  const shadowMap = (typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(max-width: 760px)').matches) ? 1024 : 2048

  return (
    <group>
      <SceneEnvironment env={env} fogNear={fogNear} fogFar={fogFar} />

      <hemisphereLight args={[env.hemi.sky, env.hemi.ground, env.hemi.intensity]} />
      <directionalLight
        position={[cx + env.sun.pos[0], env.sun.pos[1], cz + env.sun.pos[2]]}
        intensity={env.sun.intensity} color={env.sun.color} castShadow
        shadow-mapSize-width={shadowMap} shadow-mapSize-height={shadowMap}
        shadow-camera-near={1} shadow-camera-far={200}
        shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={65} shadow-camera-bottom={-65}
        shadow-bias={-0.0004} shadow-normalBias={0.02}
      />
      <directionalLight position={[cx - 18, 14, cz + 22]} intensity={env.fill.intensity} color={env.fill.color} />
      <ambientLight intensity={env.ambient} />

      {/* white studio sweep floor */}
      <SweepFloor color={env.floor.color} rough={env.floor.rough} env={env.floor.env} cx={cx} cz={cz} groundR={groundR} />

      {/* bare container bodies */}
      {modules.map((m) => <PresentModule key={m.id} mod={m} mats={mats} body={bodies[m.type]} />)}

      {/* building-level roof — only over exposed columns (never under a stacked module) */}
      <RoofLayer modules={modules} type={finish?.roof || 'flat'} mats={mats} cladColor={claddingById[finish?.cladding]?.color} />

      {/* client-placed add-ons, rendered exactly where they were designed */}
      <OpeningsLayer openings={openings} mats={mats} frameMat={openMats.frameMat} doorMat={openMats.doorMat} />
      <SolarLayer solar={solar} modules={modules} roofType={finish?.roof || 'flat'} mats={mats} />
      <TerraceLayer terrace={terrace} mats={mats} />

      {/* the soft grey grounding "square" on white — the studio look */}
      <ContactShadows position={[cx, FOUNDATION_H * 0.5, cz]} scale={squareSize} blur={2.6} far={14} opacity={0.46} resolution={1024} color={env.contact} />

      <Environment resolution={256} environmentIntensity={env.envIntensity}>
        {[[-30, -18], [0, -18], [30, -18], [-30, 18], [30, 18]].map(([x, z], i) => (
          <Lightformer key={i} intensity={1.4} form="rect" position={[x, 30, z]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 10, 1]} color={env.sun.color} />
        ))}
        <Lightformer intensity={0.7} form="rect" position={[0, 12, 50]} scale={[40, 20, 1]} color={env.bg.horizon || '#dfeaf6'} />
      </Environment>

      <PresentCamera controls={controls} apiRef={cameraApiRef} bounds={bounds} />
      <IntroSpin controls={controls} />
      <CaptureBridge captureRef={captureRef} />

      <OrbitControls
        ref={controls} makeDefault enablePan enableDamping dampingFactor={0.1}
        minDistance={6} maxDistance={maxCamDist}
        minPolarAngle={Math.PI * 0.08} maxPolarAngle={Math.PI * 0.47}
        target={[cx, bounds.height * 0.42, cz]} zoomToCursor
        onChange={() => {
          const c = controls.current
          if (c) {
            // never look below the ground (keeps the camera above the floor)
            if (c.target.y < 0) c.target.y = 0
            // keep the view anchored near the building (no flying off → no edge reveal)
            const lim = span * 1.5 + 24
            c.target.x = Math.min(Math.max(c.target.x, cx - lim), cx + lim)
            c.target.z = Math.min(Math.max(c.target.z, cz - lim), cz + lim)
          }
          invalidate()
        }}
      />
    </group>
  )
}
