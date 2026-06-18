import { useMemo } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { claddingById, sizeById, variantById } from '../data/configurator.js'
import { claddingTex, getTextures, tiled } from './textures.js'

/* steel / frame / detail colours */
const C_CAST = '#202327'
const C_FRAME = '#2b2e33'
const C_DOOR = '#34383d'
const C_FLOOR = '#1a1c1f'

/* one shared transmission-glass material for every glazed panel in the scene,
   so there is a single transmission render pass no matter how many modules. */
let _glass = null
function getGlass() {
  if (_glass) return _glass
  _glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: 0.05,
    transmission: 1, thickness: 0.55, ior: 1.5, transparent: true,
    attenuationColor: new THREE.Color('#bcd6e6'), attenuationDistance: 4.5,
    clearcoat: 0.5, clearcoatRoughness: 0.04, envMapIntensity: 2.0,
  })
  return _glass
}

function useModuleMats(cladding) {
  return useMemo(() => {
    const clad = claddingById[cladding] || claddingById.graphite
    const tex = getTextures()
    const cast = new THREE.MeshStandardMaterial({ color: C_CAST, roughness: 0.5, metalness: 0.8 })
    const frame = new THREE.MeshStandardMaterial({ color: C_FRAME, roughness: 0.45, metalness: 0.6 })
    const door = new THREE.MeshStandardMaterial({ color: C_DOOR, roughness: 0.5, metalness: 0.4 })
    const floor = new THREE.MeshStandardMaterial({ color: C_FLOOR, roughness: 0.9, metalness: 0.2 })
    const glass = getGlass() // shared transmission glass (single pass)
    // lighter matte interior so it reads as a real space behind the glass (no glow)
    const interior = new THREE.MeshStandardMaterial({ color: '#525762', roughness: 0.9, metalness: 0.05 })
    const roofMat = new THREE.MeshStandardMaterial({ color: clad.kind === 'corrugated' ? '#3a3d42' : '#43474d', roughness: 0.72, metalness: 0.35 })
    return { clad, cast, frame, door, floor, glass, interior, roofMat }
  }, [cladding])
}

/* a single framed opening on the front (+Z) wall */
function Opening({ type, x, L, H, W, m }) {
  const z = W / 2
  const zf = z + 0.012
  const els = []
  const frame = (w, h, cx, cy) => (
    <mesh key={`f${cx}${cy}${w}`} position={[cx, cy, zf]} material={m.frame}>
      <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
    </mesh>
  )
  const glassPane = (w, h, cx, cy, key) => (
    <mesh key={key} position={[cx, cy, zf + 0.01]} material={m.glass}>
      <boxGeometry args={[w, h, 0.03]} />
    </mesh>
  )

  if (type === 'door') {
    const w = 0.92, h = 2.1, cy = h / 2 + 0.04
    els.push(frame(w, h, x, cy))
    els.push(<mesh key="dl" position={[x, cy, zf + 0.012]} material={m.door}><boxGeometry args={[w, h, 0.04]} /></mesh>)
    els.push(glassPane(w * 0.62, h * 0.34, x, cy + h * 0.22, 'dg'))
    els.push(<mesh key="dh" position={[x + w * 0.32, cy, zf + 0.05]} material={m.cast}><boxGeometry args={[0.05, 0.22, 0.05]} /></mesh>)
  } else if (type === 'doubleDoor') {
    const w = 1.7, h = 2.2, cy = h / 2 + 0.04
    els.push(frame(w, h, x, cy))
    for (const s of [-1, 1]) {
      els.push(<mesh key={`dd${s}`} position={[x + s * w * 0.25, cy, zf + 0.012]} material={m.door}><boxGeometry args={[w * 0.48, h, 0.04]} /></mesh>)
      els.push(<mesh key={`dh${s}`} position={[x + s * 0.06, cy, zf + 0.05]} material={m.cast}><boxGeometry args={[0.04, 0.3, 0.04]} /></mesh>)
    }
  } else if (type === 'window') {
    const w = 1.2, h = 1.15, cy = 1.4
    els.push(frame(w, h, x, cy))
    els.push(glassPane(w, h, x, cy, 'wg'))
    els.push(<mesh key="wm" position={[x, cy, zf + 0.02]} material={m.frame}><boxGeometry args={[0.04, h, 0.04]} /></mesh>)
    els.push(<mesh key="ws" position={[x, cy - h / 2 - 0.04, zf + 0.03]} material={m.frame}><boxGeometry args={[w + 0.14, 0.08, 0.12]} /></mesh>)
  } else if (type === 'windowBand') {
    const w = Math.min(L - 1.0, L * 0.78), h = 1.0, cy = 1.55
    els.push(frame(w, h, x, cy))
    els.push(glassPane(w, h, x, cy, 'bg'))
    const mull = Math.max(2, Math.round(w / 1.1))
    for (let i = 1; i < mull; i++) {
      els.push(<mesh key={`bm${i}`} position={[x - w / 2 + (w / mull) * i, cy, zf + 0.02]} material={m.frame}><boxGeometry args={[0.05, h, 0.04]} /></mesh>)
    }
  } else if (type === 'shopfront') {
    const w = Math.min(2.8, L * 0.5), h = 2.1, cy = h / 2 + 0.18
    els.push(frame(w, h, x, cy))
    els.push(glassPane(w, h, x, cy, 'sg'))
    els.push(<mesh key="sm" position={[x, cy, zf + 0.02]} material={m.frame}><boxGeometry args={[0.05, h, 0.04]} /></mesh>)
    els.push(<mesh key="sm2" position={[x, cy + 0.2, zf + 0.02]} material={m.frame}><boxGeometry args={[w, 0.05, 0.04]} /></mesh>)
  } else if (type === 'glazed') {
    const w = L - 0.5, h = H - 0.5, cy = H / 2 - 0.05
    els.push(<mesh key="gf" position={[x, cy, zf]} material={m.frame}><boxGeometry args={[w + 0.1, h + 0.1, 0.05]} /></mesh>)
    els.push(glassPane(w, h, x, cy, 'gg'))
    const mull = Math.max(3, Math.round(w / 1.2))
    for (let i = 1; i < mull; i++) {
      els.push(<mesh key={`gm${i}`} position={[x - w / 2 + (w / mull) * i, cy, zf + 0.02]} material={m.frame}><boxGeometry args={[0.05, h, 0.05]} /></mesh>)
    }
    els.push(<mesh key="gmh" position={[x, cy + h * 0.18, zf + 0.02]} material={m.frame}><boxGeometry args={[w, 0.05, 0.05]} /></mesh>)
  } else if (type === 'rollup') {
    const w = Math.min(2.6, L * 0.62), h = 2.3, cy = h / 2 + 0.05
    els.push(frame(w, h, x, cy))
    const slats = 11
    for (let i = 0; i < slats; i++) {
      const sy = 0.18 + (i + 0.5) * ((h - 0.2) / slats)
      const shade = i % 2 ? '#3c4045' : '#33373b'
      els.push(<mesh key={`rs${i}`} position={[x, sy, zf + 0.02]}><boxGeometry args={[w, (h - 0.2) / slats - 0.02, 0.05]} /><meshStandardMaterial color={shade} metalness={0.6} roughness={0.4} /></mesh>)
    }
  } else if (type === 'open') {
    const w = Math.min(2.6, L * 0.5), h = 1.3, cy = 1.5
    els.push(<mesh key="oi" position={[x, cy, z - 0.18]} material={m.interior}><boxGeometry args={[w, h, 0.04]} /></mesh>)
    els.push(frame(w, h, x, cy))
    // counter / bar ledge
    els.push(<mesh key="oc" position={[x, cy - h / 2 - 0.02, z + 0.16]} material={m.cast}><boxGeometry args={[w + 0.4, 0.1, 0.5]} /></mesh>)
    // shutter up
    els.push(<mesh key="osh" position={[x, cy + h / 2 + 0.32, z + 0.2]} material={m.door}><boxGeometry args={[w + 0.2, 0.12, 0.5]} /></mesh>)
  } else if (type === 'louver') {
    const w = 1.3, h = 1.5, cy = 1.5
    els.push(frame(w, h, x, cy))
    const slats = 9
    for (let i = 0; i < slats; i++) {
      const sy = cy - h / 2 + (i + 0.5) * (h / slats)
      els.push(<mesh key={`lv${i}`} position={[x, sy, zf + 0.02]} rotation={[-0.4, 0, 0]} material={m.frame}><boxGeometry args={[w, h / slats - 0.01, 0.04]} /></mesh>)
    }
  }
  return <group>{els}</group>
}

export default function ContainerModule({ variant, size, cladding, roof = 'flat', selected, hovered, onSelect, onHover, ...props }) {
  const m = useModuleMats(cladding)
  const s = sizeById[size] || sizeById['20']
  const v = variantById[variant] || variantById.blank
  const { L, W, H } = s

  // build the cladding material for this body size: map + bump tiled to scale
  const body = useMemo(() => {
    const k = m.clad.kind
    const pair = claddingTex(k)
    const rx = k === 'wood' ? 1.1 : L * 2.2
    const ry = k === 'wood' ? H * 1.5 : 1
    const map = tiled(pair.map, rx, ry); map.colorSpace = THREE.SRGBColorSpace
    const bump = tiled(pair.bump, rx, ry)
    return new THREE.MeshStandardMaterial({
      map, bumpMap: bump,
      bumpScale: k === 'corrugated' ? 0.045 : k === 'panel' ? 0.04 : k === 'wood' ? 0.03 : 0.012,
      color: m.clad.color,
      roughness: k === 'render' ? 0.9 : k === 'wood' ? 0.72 : 0.42,
      metalness: k === 'corrugated' || k === 'panel' ? 0.5 : 0.06,
      envMapIntensity: 0.85,
    })
  }, [m, L, H])

  const usable = L / 2 - 0.7
  const openings = v.openings.map((o, i) => ({ ...o, key: i, worldX: (o.x || 0) * usable }))

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]

  return (
    <group {...props}>
      {/* selectable hit body */}
      <mesh
        position={[0, H / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); onHover?.(true) }}
        onPointerOut={(e) => { e.stopPropagation(); onHover?.(false) }}
        onPointerDown={(e) => { e.stopPropagation(); onSelect?.() }}
        castShadow receiveShadow
        material={body}
      >
        <boxGeometry args={[L, H, W]} />
      </mesh>

      {/* dark interior shell (so openings read as depth) */}
      <mesh position={[0, H / 2, 0]} material={m.interior}>
        <boxGeometry args={[L - 0.16, H - 0.16, W - 0.16]} />
      </mesh>

      {/* floor pan */}
      <mesh position={[0, 0.06, 0]} material={m.floor}><boxGeometry args={[L + 0.04, 0.12, W + 0.04]} /></mesh>

      {/* corner castings */}
      {corners.map(([sx, sz], i) => (
        <group key={i}>
          <mesh position={[sx * (L / 2 - 0.09), 0.12, sz * (W / 2 - 0.09)]} material={m.cast}><boxGeometry args={[0.2, 0.24, 0.2]} /></mesh>
          <mesh position={[sx * (L / 2 - 0.09), H - 0.12, sz * (W / 2 - 0.09)]} material={m.cast}><boxGeometry args={[0.2, 0.24, 0.2]} /></mesh>
          <mesh position={[sx * (L / 2 - 0.05), H / 2, sz * (W / 2 - 0.05)]} material={m.frame}><boxGeometry args={[0.1, H, 0.1]} /></mesh>
        </group>
      ))}
      {/* top & bottom rails */}
      <mesh position={[0, H - 0.04, 0]} material={m.frame}><boxGeometry args={[L, 0.12, W]} /></mesh>
      <mesh position={[0, 0.16, 0]} material={m.frame}><boxGeometry args={[L, 0.12, W]} /></mesh>

      {/* roof */}
      {roof === 'flat' && <mesh position={[0, H + 0.03, 0]} material={m.roofMat} castShadow><boxGeometry args={[L + 0.08, 0.08, W + 0.08]} /></mesh>}
      {roof === 'parapet' && (
        <group>
          <mesh position={[0, H + 0.03, 0]} material={m.roofMat}><boxGeometry args={[L + 0.08, 0.08, W + 0.08]} /></mesh>
          {[[0, 1], [0, -1], [1, 0], [-1, 0]].map(([ax, az], i) => (
            <mesh key={i} position={[ax * (L / 2), H + 0.2, az * (W / 2)]} material={m.frame}>
              <boxGeometry args={ax ? [0.08, 0.34, W + 0.12] : [L + 0.12, 0.34, 0.08]} />
            </mesh>
          ))}
        </group>
      )}
      {roof === 'gable' && (() => {
        const rise = W * 0.42
        const ang = Math.atan2(rise, W / 2)
        const slant = Math.hypot(W / 2, rise)
        return (
          <group position={[0, H + 0.05, 0]}>
            <mesh position={[0, rise / 2, W / 4]} rotation={[ang, 0, 0]} castShadow material={m.roofMat}>
              <boxGeometry args={[L + 0.12, 0.08, slant + 0.06]} />
            </mesh>
            <mesh position={[0, rise / 2, -W / 4]} rotation={[-ang, 0, 0]} castShadow material={m.roofMat}>
              <boxGeometry args={[L + 0.12, 0.08, slant + 0.06]} />
            </mesh>
            <mesh position={[0, rise + 0.02, 0]} material={m.cast}><boxGeometry args={[L + 0.14, 0.07, 0.09]} /></mesh>
          </group>
        )
      })()}

      {/* openings on the front wall */}
      {openings.map((o) => (
        <Opening key={o.key} type={o.type} x={o.worldX} L={L} H={H} W={W} m={m} />
      ))}

      {/* corner glazing variant → glaze the +X end wall too */}
      {v.corner && (
        <group rotation={[0, Math.PI / 2, 0]} position={[L / 2 - W / 2, 0, 0]}>
          <Opening type="glazed" x={0} L={W} H={H} W={W} m={m} />
        </group>
      )}

      {/* hover → soft highlight only (not constant); selected → thin outline */}
      {hovered && !selected && (
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[L + 0.1, H + 0.1, W + 0.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.09} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[L + 0.04, H + 0.04, W + 0.04]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#f0581f" lineWidth={1.8} />
        </mesh>
      )}
    </group>
  )
}
