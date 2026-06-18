/* Randomised stress test of the placement pipeline — runs the SAME functions
   the app uses (validatePlacement + pruneFloating) over thousands of random
   operations and asserts the build NEVER reaches an invalid state
   (no overlap on a floor, no module below the support threshold). Seeded so
   any failure is reproducible. Run with `node`. */
import {
  validatePlacement, pruneFloating, footprintCells, occupancyByFloor,
  supportRatio, inBounds, MODULE_TYPES, MAX_FLOORS, SUPPORT_MIN, nextId,
} from '../src/data/builder.js'

// tiny deterministic PRNG (mulberry32)
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function invariant(modules) {
  const byFloor = new Map()
  for (const m of modules) {
    let s = byFloor.get(m.floor)
    if (!s) { s = new Set(); byFloor.set(m.floor, s) }
    for (const k of footprintCells(m)) {
      if (s.has(k)) return `OVERLAP floor ${m.floor} cell ${k}`
      s.add(k)
    }
    if (!inBounds(m)) return `OUT OF BOUNDS ${m.id}`
  }
  const occ = occupancyByFloor(modules)
  for (const m of modules) {
    if (m.floor > 0 && supportRatio(m, occ) < SUPPORT_MIN) return `FLOATING ${m.id}`
  }
  return null
}

const RUNS = 8
const OPS = 4000
let totalPlaced = 0, totalErased = 0, totalRotated = 0, totalMoved = 0, totalRejected = 0
let failure = null

outer:
for (let run = 0; run < RUNS && !failure; run++) {
  const rand = rng(1000 + run * 7)
  const ri = (n) => Math.floor(rand() * n)
  let modules = []

  for (let i = 0; i < OPS; i++) {
    const r = rand()
    if (r < 0.5 || modules.length === 0) {
      const cand = {
        id: nextId(),
        type: MODULE_TYPES[ri(MODULE_TYPES.length)].id,
        cx: ri(20) - 10, cz: ri(20) - 10, floor: ri(MAX_FLOORS), rot: ri(2),
      }
      const v = validatePlacement(cand, modules)
      if (v.ok) { modules = [...modules, cand]; totalPlaced++ } else totalRejected++
    } else if (r < 0.7) {
      const id = modules[ri(modules.length)].id
      const after = modules.filter((m) => m.id !== id)
      modules = pruneFloating(after).modules
      totalErased++
    } else if (r < 0.88) {
      const m = modules[ri(modules.length)]
      const cand = { ...m, rot: m.rot ? 0 : 1 }
      const v = validatePlacement(cand, modules)
      if (v.ok) { modules = pruneFloating(modules.map((x) => (x.id === m.id ? cand : x))).modules; totalRotated++ }
      else totalRejected++
    } else {
      const m = modules[ri(modules.length)]
      const f = m.floor + (rand() < 0.5 ? 1 : -1)
      if (f >= 0 && f < MAX_FLOORS) {
        const cand = { ...m, floor: f }
        const v = validatePlacement(cand, modules)
        if (v.ok) { modules = pruneFloating(modules.map((x) => (x.id === m.id ? cand : x))).modules; totalMoved++ }
        else totalRejected++
      }
    }

    const bad = invariant(modules)
    if (bad) { failure = { run, op: i, bad, count: modules.length }; break outer }
  }
}

if (failure) {
  console.error('✗ STRESS FAILED:', JSON.stringify(failure))
  process.exit(1)
} else {
  console.log(`✓ STRESS PASS — ${RUNS} runs × ${OPS} ops, invariants held throughout`)
  console.log(`  placed=${totalPlaced} erased=${totalErased} rotated=${totalRotated} moved=${totalMoved} rejected=${totalRejected}`)
  process.exit(0)
}
