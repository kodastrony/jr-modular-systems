import { Suspense, lazy, useEffect } from 'react'
import { Canvas, invalidate, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import BuildScene, { BUILD_BG, makeSkyTexture } from './BuildScene.jsx'

const PRESENT_BG = '#aeb6c0'

const PresentScene = lazy(() => import('./PresentScene.jsx'))

/* DEV-only bridge so the headless preview can verify WebGL output
   (screenshots can't capture a live canvas here — re-render + toDataURL can). */
function DebugBridge() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__cfg = {
      gl, scene, camera, THREE, invalidate,
      capture() { gl.render(scene, camera); return gl.domElement.toDataURL('image/png') },
      meshCount() { let n = 0; scene.traverse((o) => { if (o.isMesh) n++ }); return n },
    }
    return () => { if (window.__cfg?.gl === gl) delete window.__cfg }
  }, [gl, scene, camera])
  return null
}

/* One WebGL context for the whole configurator. The subtree swaps between the
   lightweight build editor and the heavy visualisation — never two canvases
   (which would double VRAM and risk context limits). frameloop="demand" keeps
   it at ~0% GPU when idle; every mutation calls invalidate(). */
export default function ConfiguratorCanvas(props) {
  const { mode, onReady } = props

  // a couple of resize nudges fix the initial 0-size canvas in flex layouts
  useEffect(() => {
    const fire = () => { window.dispatchEvent(new Event('resize')); invalidate() }
    const ids = [0, 80, 220, 500].map((t) => setTimeout(fire, t))
    return () => ids.forEach(clearTimeout)
  }, [mode])

  // cap the pixel ratio lower on phones — full retina dpr over a shadowed scene
  // is the main source of jank on weak mobile GPUs (AdaptiveDpr trims further)
  const isMobile = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(max-width: 760px)').matches
  const maxDpr = mode === 'present' ? (isMobile ? 1.5 : 2) : (isMobile ? 1.25 : 1.6)

  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, maxDpr]}
      camera={{ position: [18, 18, 18], fov: 32, near: 0.5, far: 1200 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.07 }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color(mode === 'present' ? PRESENT_BG : BUILD_BG)
        onReady?.()
        requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); invalidate() })
      }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <AdaptiveDpr pixelated={false} />
      <DebugBridge />
      <BackgroundSync mode={mode} />
      {mode === 'build' ? (
        <BuildScene {...props} />
      ) : (
        <Suspense fallback={null}>
          <PresentScene {...props} />
        </Suspense>
      )}
    </Canvas>
  )
}

/* Build mode gets a soft radial-gradient "sky" (set imperatively, since a texture
   background can't be a declarative <color>); present mode keeps its flat tone. */
function BackgroundSync({ mode }) {
  const { scene } = useThree()
  useEffect(() => {
    // present mode owns its own scenery background/fog (see PresentScene → SceneEnvironment)
    if (mode === 'present') { invalidate(); return }
    const tex = makeSkyTexture()
    scene.background = tex || new THREE.Color(BUILD_BG)
    invalidate()
    return () => { if (tex) tex.dispose() }
  }, [mode, scene])
  return null
}
