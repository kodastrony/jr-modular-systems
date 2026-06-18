import { Suspense, useState } from 'react'
import ConfiguratorCanvas from '../three/builder/ConfiguratorCanvas.jsx'

/* Home-page showpiece: a real snippet of an actual project, rendered through the
   exact same pipeline as the configurator's "Generuj wizualizację" (present mode).

   Simple build per the client sketch: THREE containers, a stepped massing
   (two on the ground + one on top), a flat roof so PV panels mount cleanly,
   solar panels on both roof levels, a front terrace deck, a full set of windows
   and an entrance door.

   Builder cell model: CELL = 1.22 m, 40' = 10×2 cells. Footprint 10×4 cells. */
const MODULES = [
  { id: 'g1', type: 'm40', cx: 0, cz: 0, floor: 0, rot: 0 }, // ground rear
  { id: 'g2', type: 'm40', cx: 0, cz: 2, floor: 0, rot: 0 }, // ground front
  { id: 'u1', type: 'm40', cx: 0, cz: 0, floor: 1, rot: 0 }, // upper (over rear → step)
]

/* doors / windows on the camera-facing walls (+Z front, +X right end) */
const OPENINGS = [
  // ground — front façade (+Z, z3)
  { x: 1, z: 3, side: 'pz', floor: 0, type: 'window' },
  { x: 3, z: 3, side: 'pz', floor: 0, type: 'window' },
  { x: 6, z: 3, side: 'pz', floor: 0, type: 'window' },
  { x: 8, z: 3, side: 'pz', floor: 0, type: 'door' },
  // ground — right end (+X, x9)
  { x: 9, z: 2, side: 'px', floor: 0, type: 'window' },
  { x: 9, z: 3, side: 'px', floor: 0, type: 'window' },
  // upper — front façade (+Z, z1)
  { x: 1, z: 1, side: 'pz', floor: 1, type: 'window' },
  { x: 4, z: 1, side: 'pz', floor: 1, type: 'window' },
  { x: 7, z: 1, side: 'pz', floor: 1, type: 'window' },
  // upper — right end (+X, x9)
  { x: 9, z: 0, side: 'px', floor: 1, type: 'window' },
  { x: 9, z: 1, side: 'px', floor: 1, type: 'window' },
]

/* a timber terrace deck in front of the building (left side, "TARAS") */
const TERRACE = []
for (let x = 0; x <= 5; x++) for (let z = 4; z <= 5; z++) TERRACE.push({ x, z })

/* PV panels on both flat roofs (upper = level 1, front-lower = level 0) */
const SOLAR = []
for (let x = 1; x <= 8; x++) for (let z = 0; z <= 1; z++) SOLAR.push({ x, z, floor: 1 }) // upper roof
for (let x = 1; x <= 8; x++) for (let z = 2; z <= 3; z++) SOLAR.push({ x, z, floor: 0 }) // front-lower roof

const FINISH = { cladding: 'wood', roof: 'parapet', tier: 'plus' }

export default function ConfigPreview() {
  const [ready, setReady] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Suspense fallback={null}>
        <ConfiguratorCanvas
          mode="present"
          modules={MODULES}
          openings={OPENINGS}
          solar={SOLAR}
          terrace={TERRACE}
          finish={FINISH}
          onReady={() => setReady(true)}
        />
      </Suspense>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div className="spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--accent)', animation: 'spin 0.9s linear infinite' }} />
        </div>
      )}
    </div>
  )
}
