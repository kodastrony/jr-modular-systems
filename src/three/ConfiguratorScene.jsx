import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useThree, invalidate } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import ContainerModule from './ContainerModule.jsx'
import { getTextures } from './textures.js'
import { sizeById } from '../data/configurator.js'

const GAP = 0.06
const LEVEL_H = 2.66 // vertical pitch between stacked floors

function useLayout(modules) {
  return useMemo(() => {
    // group modules by storey, lay each storey out as a centred row, stack on Y
    const byLevel = new Map()
    modules.forEach((m, i) => {
      const lv = m.level || 0
      if (!byLevel.has(lv)) byLevel.set(lv, [])
      byLevel.get(lv).push({ m, i })
    })
    const positions = new Array(modules.length)
    let maxRow = 0, maxLevel = 0
    byLevel.forEach((items, lv) => {
      const lens = items.map((it) => (sizeById[it.m.size] || sizeById['20']).L)
      const row = lens.reduce((a, b) => a + b, 0) + GAP * Math.max(0, items.length - 1)
      maxRow = Math.max(maxRow, row)
      maxLevel = Math.max(maxLevel, lv)
      let cursor = -row / 2
      items.forEach((it, k) => {
        const x = cursor + lens[k] / 2
        cursor += lens[k] + GAP
        positions[it.i] = [x, lv * LEVEL_H, 0]
      })
    })
    return { positions, total: maxRow, levels: maxLevel + 1 }
  }, [modules])
}

/* Bright rectangular showroom: glossy floor that reflects the ceiling lights,
   a dark ceiling with a grid of light panels, and light hangar walls.
   All static geometry + env-map reflections — no real-time reflection, no lag. */
const ROOM_W = 170, ROOM_D = 120, ROOM_H = 38

function Studio({ preview }) {
  const { floorTex, wallTex } = useMemo(() => {
    const f = getTextures().floor.clone(); f.colorSpace = THREE.SRGBColorSpace; f.needsUpdate = true
    const w = getTextures().wall.clone(); w.colorSpace = THREE.SRGBColorSpace; w.wrapS = w.wrapT = THREE.RepeatWrapping; w.repeat.set(6, 1); w.needsUpdate = true
    return { floorTex: f, wallTex: w }
  }, [])

  const panels = useMemo(() => {
    const cols = 6, rows = 4, gx = 26, gz = 22, arr = []
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      arr.push([(i - (cols - 1) / 2) * gx, (j - (rows - 1) / 2) * gz])
    }
    return arr
  }, [])

  return (
    <group>
      {/* glossy showroom floor — soft reflections of the overhead lights */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={floorTex} color="#ffffff" roughness={preview ? 0.42 : 0.34} metalness={0.26} envMapIntensity={1.3} />
      </mesh>

      {!preview && (
        <group>
          {/* ceiling */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
            <planeGeometry args={[ROOM_W, ROOM_D]} />
            <meshStandardMaterial color="#23262c" roughness={0.92} />
          </mesh>
          {/* skylight / fixture panels */}
          {panels.map(([x, z], i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[x, ROOM_H - 0.3, z]}>
              <planeGeometry args={[15, 7]} />
              <meshStandardMaterial color="#ffffff" emissive="#eef3fb" emissiveIntensity={1.35} toneMapped={false} />
            </mesh>
          ))}
          {/* walls (light at the bottom, dark at the top) */}
          {[
            { p: [0, ROOM_H / 2, -ROOM_D / 2], r: [0, 0, 0], w: ROOM_W },
            { p: [0, ROOM_H / 2, ROOM_D / 2], r: [0, Math.PI, 0], w: ROOM_W },
            { p: [-ROOM_W / 2, ROOM_H / 2, 0], r: [0, Math.PI / 2, 0], w: ROOM_D },
            { p: [ROOM_W / 2, ROOM_H / 2, 0], r: [0, -Math.PI / 2, 0], w: ROOM_D },
          ].map((wll, i) => (
            <mesh key={i} position={wll.p} rotation={wll.r}>
              <planeGeometry args={[wll.w, ROOM_H]} />
              <meshStandardMaterial map={wallTex} roughness={0.96} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

/* one-time intro orbit, then the scene idles (frameloop: demand) */
function IntroSpin({ controls, run }) {
  useEffect(() => {
    if (!run) return
    let raf, started = null
    const tick = (now) => {
      if (started === null) started = now
      const t = (now - started) / 1000
      if (controls.current && t < 3.4) {
        const ease = 1 - t / 3.4
        controls.current.setAzimuthalAngle(controls.current.getAzimuthalAngle() - 0.0052 * ease)
        controls.current.update()
        invalidate()
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, controls])
  return null
}

function FitCamera({ total, levels, targetY, preview }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    const k = preview ? 0.98 : 1.12
    const heightBoost = Math.max(0, levels - 1) * 2.6
    const want = THREE.MathUtils.clamp(total * k + (preview ? 3.6 : 4.5) + heightBoost, preview ? 8 : 11, 42)
    const tgt = controls?.target || new THREE.Vector3(0, targetY, 0)
    const dir = camera.position.clone().sub(tgt)
    if (dir.length() < 0.001) dir.set(1, 0.5, 1.3)
    dir.setLength(want)
    camera.position.copy(tgt).add(dir)
    camera.updateProjectionMatrix()
    invalidate()
  }, [total, levels, targetY, preview, camera, controls])
  return null
}

function ControlsInvalidator({ controls }) {
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const onChange = () => invalidate()
    c.addEventListener('change', onChange)
    return () => c.removeEventListener('change', onChange)
  })
  return null
}

function CaptureBridge({ captureRef }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!captureRef) return
    captureRef.current = () => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
    return () => { if (captureRef) captureRef.current = null }
  }, [gl, scene, camera, captureRef])
  return null
}

export default function ConfiguratorScene({ modules, cladding, roof, selectedId, onSelect, hoverId, onHover, onReady, captureRef, autoRotate = true, mode = 'full' }) {
  const controls = useRef()
  const { positions, total, levels } = useLayout(modules)
  const preview = mode === 'preview'
  const targetY = 1.25 + Math.max(0, levels - 1) * 1.0

  useEffect(() => {
    const fire = () => { window.dispatchEvent(new Event('resize')); invalidate() }
    const ids = [0, 80, 200, 450, 900].map((t) => setTimeout(fire, t))
    return () => ids.forEach(clearTimeout)
  }, [])

  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.7]}
      camera={{ position: preview ? [11, 7.5, 14] : [14, 16, 16], fov: preview ? 34 : 30, near: 0.1, far: 320 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.06 }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      onCreated={() => {
        onReady?.()
        requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); invalidate() })
        setTimeout(() => { window.dispatchEvent(new Event('resize')); invalidate() }, 140)
      }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <AdaptiveDpr pixelated={false} />

      {/* the bright room (env + light panels) carries most of the lighting;
          a soft key adds the contact shadow + gentle modelling */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#eef3f8', '#54585f', 0.45]} />
      {/* KEY — from the camera-front upper, grazes the corrugation so ribs + faces read */}
      <directionalLight
        position={[16, 19, 15]} intensity={2.5} color="#fff7ee" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={1} shadow-camera-far={110}
        shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={30} shadow-camera-bottom={-26}
        shadow-bias={-0.0003}
      />
      {/* FILL — opens the front/shadow side so nothing goes black */}
      <directionalLight position={[-12, 9, 18]} intensity={1.15} color="#eaf1f8" />
      {/* RIM — gentle back-edge separation */}
      <directionalLight position={[-10, 14, -16]} intensity={0.5} color="#cfe0f0" />

      <group>
        {modules.map((mod, i) => (
          <ContainerModule
            key={mod.id}
            variant={mod.variant}
            size={mod.size}
            cladding={cladding}
            roof={roof}
            selected={selectedId === mod.id}
            hovered={hoverId === mod.id}
            onSelect={() => onSelect?.(mod.id)}
            onHover={(h) => onHover?.(h ? mod.id : null)}
            position={positions[i]}
          />
        ))}
      </group>

      <Studio preview={preview} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={Math.max(26, total * 2.4)} blur={2.6} far={9} resolution={512} color="#0a0c10" />

      <Environment resolution={256} environmentIntensity={0.6}>
        {[[-30, -18], [0, -18], [30, -18], [-30, 18], [0, 18], [30, 18]].map(([x, z], i) => (
          <Lightformer key={i} intensity={1.5} form="rect" position={[x, 30, z]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 8, 1]} color="#ffffff" />
        ))}
        <Lightformer intensity={0.6} form="rect" position={[0, 10, 40]} scale={[30, 16, 1]} color="#eef4fb" />
        <Lightformer intensity={0.5} form="rect" position={[24, 8, 10]} scale={[16, 12, 1]} color="#ffffff" />
      </Environment>

      <FitCamera total={total} levels={levels} targetY={targetY} preview={preview} />
      <IntroSpin controls={controls} run={autoRotate} />
      <ControlsInvalidator controls={controls} />
      <CaptureBridge captureRef={captureRef} />

      <OrbitControls
        ref={controls} makeDefault enablePan={!preview}
        minDistance={preview ? 7 : 8} maxDistance={preview ? 28 : 44}
        minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.48}
        target={[0, targetY, 0]} enableDamping dampingFactor={0.1}
      />

      {/* subtle glow on the actual ceiling lights only — not the floor reflection */}
      <EffectComposer disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={1.25} intensity={0.22} radius={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
