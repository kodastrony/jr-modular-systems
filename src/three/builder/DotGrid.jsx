import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { CELL, PLOT_CELLS } from '../../data/builder.js'

/* Procedural dot-lattice on the ground (or any storey) plane.
   A single transparent plane with a fragment shader that paints a soft grey
   dot at every CELL intersection, fading with distance. Costs one draw call
   and zero geometry — scales to any plot size without lag. */

const SIZE = PLOT_CELLS * CELL

const vertex = /* glsl */`
  varying vec2 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const fragment = /* glsl */`
  precision highp float;
  varying vec2 vWorld;
  uniform float uCell;
  uniform float uRadius;
  uniform float uFade;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    // distance to nearest lattice point (per-axis, in metres)
    vec2 g = abs(fract(vWorld / uCell + 0.5) - 0.5) * uCell;
    float d = length(g);
    float dot = 1.0 - smoothstep(uRadius * 0.55, uRadius, d);
    // emphasise every other line (module-width raster) very subtly
    float dist = length(vWorld);
    float fade = 1.0 - smoothstep(uFade * 0.45, uFade, dist);
    float a = dot * fade * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

export default function DotGrid({ y = 0.02, color = '#aeb6c2', opacity = 0.6, radius = 0.07 }) {
  const matRef = useRef()
  const uniforms = useMemo(() => ({
    uCell: { value: CELL },
    uRadius: { value: radius },
    uFade: { value: SIZE * 0.46 },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!matRef.current) return
    matRef.current.uniforms.uColor.value.set(color)
    matRef.current.uniforms.uOpacity.value = opacity
    matRef.current.uniforms.uRadius.value = radius
  }, [color, opacity, radius])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} raycast={() => null} renderOrder={1}>
      <planeGeometry args={[SIZE, SIZE]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
