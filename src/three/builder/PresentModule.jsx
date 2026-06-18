import { useMemo } from 'react'
import { MODULE_H, FOUNDATION_H, moduleTypeById, worldPosition } from '../../data/builder.js'

/* Bare container body for PRESENT mode — cladding box + dark interior shell
   (so openings read as real reveals), floor pan, corner castings, rails and a
   ground plinth. Doors / windows / solar / terrace are placed by the client
   and rendered as separate building-level layers (see PresentScene). */
export default function PresentModule({ mod, mats, body }) {
  const t = moduleTypeById[mod.type]
  const L = t.lengthM, W = t.widthM, H = MODULE_H
  const pos = worldPosition(mod)
  const ry = mod.rot ? Math.PI / 2 : 0
  const ground = mod.floor === 0
  const corners = useMemo(() => [[-1, -1], [1, -1], [1, 1], [-1, 1]], [])

  return (
    <group position={[pos[0], pos[1], pos[2]]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[L, H, W]} />
      </mesh>
      {/* dark interior shell so client-placed openings read as depth */}
      <mesh position={[0, 0, 0]} material={mats.interior}>
        <boxGeometry args={[L - 0.16, H - 0.16, W - 0.16]} />
      </mesh>
      <mesh position={[0, -H / 2 + 0.06, 0]} material={mats.floorPan}><boxGeometry args={[L + 0.04, 0.12, W + 0.04]} /></mesh>
      {ground && (
        <mesh position={[0, -H / 2 - FOUNDATION_H / 2, 0]} material={mats.plinth} receiveShadow>
          <boxGeometry args={[L + 0.06, FOUNDATION_H, W + 0.06]} />
        </mesh>
      )}
      {corners.map(([sx, sz], i) => (
        <group key={i}>
          <mesh position={[sx * (L / 2 - 0.09), -H / 2 + 0.12, sz * (W / 2 - 0.09)]} material={mats.cast}><boxGeometry args={[0.2, 0.24, 0.2]} /></mesh>
          <mesh position={[sx * (L / 2 - 0.09), H / 2 - 0.12, sz * (W / 2 - 0.09)]} material={mats.cast}><boxGeometry args={[0.2, 0.24, 0.2]} /></mesh>
          <mesh position={[sx * (L / 2 - 0.05), 0, sz * (W / 2 - 0.05)]} material={mats.frame}><boxGeometry args={[0.1, H, 0.1]} /></mesh>
        </group>
      ))}
      <mesh position={[0, H / 2 - 0.04, 0]} material={mats.frame}><boxGeometry args={[L, 0.12, W]} /></mesh>
      <mesh position={[0, -H / 2 + 0.16, 0]} material={mats.frame}><boxGeometry args={[L, 0.12, W]} /></mesh>
    </group>
  )
}
