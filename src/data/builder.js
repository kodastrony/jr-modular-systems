/* ============================================================
   MODULAR BUILDER — grid model, placement physics, presets
   ------------------------------------------------------------
   The configurator is a grid editor. The plot is a square lattice
   of CELL-sized square cells. Every module footprint is an integer
   rectangle of cells, so:
     • side-by-side / end-to-end tiling is gap-free,
     • 90° rotation maps whole cells → whole cells (5×2 → 2×5),
     • collisions & support are trivial set operations on cells.

   Container proportions drive the lattice: a 20' module is 6.0×2.4 m,
   a 40' is 12.0×2.4 m. GCD(6.0, 2.4) = 1.2 m → CELL = 1.2 m makes
   both dimensions land on whole cells (5×2 and 10×2).

   A placed module is the serialisable record:
     { id, type, cx, cz, floor, rot }
   where (cx, cz) is the min-corner CELL of the footprint (integers,
   may be negative — the plot is centred on the origin), floor is the
   storey index (0 = parter), rot ∈ {0, 1} (0 = length along X).
   ============================================================ */

import {
  CLADDINGS, claddingById, ROOFS, roofById, ADDONS, addonById,
  TIERS, tierById, fmtPLN,
} from './configurator.js'

export { CLADDINGS, claddingById, ROOFS, roofById, ADDONS, addonById, TIERS, tierById, fmtPLN }

/* ---- grid + storey geometry (metres) ----
   CELL = 1.22 m makes the square lattice land real ISO container sizes:
   width 2.44 m (2 cells, exact ISO 2.438), 20' = 6.10 m (5 cells), 40' = 12.20 m
   (10 cells) — both within ~1% of real (6.058 / 12.192). Square cells keep 90°
   rotation and gap-free tiling intact. */
export const CELL = 1.22         // square lattice pitch
export const MODULE_H = 2.59     // ISO container height (standard)
export const FLOOR_H = 2.62      // storey pitch (stacked corner-castings + seam)
export const FOUNDATION_H = 0.18 // plinth lift off the ground plane
export const MAX_FLOORS = 3      // storeys 0..2 (no extra steel frame)
export const SUPPORT_MIN = 0.5   // upper module needs ≥50% of cells supported
export const PLOT_CELLS = 44     // plot is PLOT_CELLS × PLOT_CELLS cells (~54 m), centred

/* ---- module catalogue (footprint in CELLs, length along local X) ---- */
export const MODULE_TYPES = [
  {
    id: 'm20', name: "Moduł 20'", short: "20'",
    lenCells: 5, widCells: 2, lengthM: 6.1, widthM: 2.44,
    areaM2: 15, basePrice: 0, group: 'Kontener',
    desc: '≈6,06 × 2,44 m — kontener ISO 20 stóp',
  },
  {
    id: 'm40', name: "Moduł 40'", short: "40'",
    lenCells: 10, widCells: 2, lengthM: 12.2, widthM: 2.44,
    areaM2: 30, basePrice: 0, group: 'Kontener',
    desc: '≈12,19 × 2,44 m — kontener ISO 40 stóp',
  },
]
export const moduleTypeById = Object.fromEntries(MODULE_TYPES.map((m) => [m.id, m]))

/* ---- footprint helpers --------------------------------------------------- */

/** Footprint dimensions (in cells) for a type at a rotation. */
export function footprintDims(type, rot) {
  const t = typeof type === 'string' ? moduleTypeById[type] : type
  if (!t) return { w: 1, d: 1 }
  return rot ? { w: t.widCells, d: t.lenCells } : { w: t.lenCells, d: t.widCells }
}

export const cellKey = (x, z) => `${x},${z}`

/** Every cell key a module occupies on its floor. */
export function footprintCells(mod) {
  const { w, d } = footprintDims(mod.type, mod.rot)
  const out = []
  for (let x = mod.cx; x < mod.cx + w; x++)
    for (let z = mod.cz; z < mod.cz + d; z++) out.push(cellKey(x, z))
  return out
}

/** Centre of a module footprint in world metres: [x, y, z]. */
export function worldPosition(mod) {
  const { w, d } = footprintDims(mod.type, mod.rot)
  const x = (mod.cx + w / 2) * CELL
  const z = (mod.cz + d / 2) * CELL
  const y = FOUNDATION_H + mod.floor * FLOOR_H + MODULE_H / 2
  return [x, y, z]
}

/** Footprint size in world metres for a box mesh: [sx, sz]. */
export function footprintMetres(mod) {
  const { w, d } = footprintDims(mod.type, mod.rot)
  return [w * CELL, d * CELL]
}

/* ---- occupancy + validation --------------------------------------------- */

const HALF_PLOT = PLOT_CELLS / 2

/** Map: floor → Set(cellKey) of every occupied cell, optionally skipping one id. */
export function occupancyByFloor(modules, skipId = null) {
  const map = new Map()
  for (const m of modules) {
    if (m.id === skipId) continue
    let set = map.get(m.floor)
    if (!set) { set = new Set(); map.set(m.floor, set) }
    for (const k of footprintCells(m)) set.add(k)
  }
  return map
}

/** Is the whole footprint inside the plot bounds? */
export function inBounds(mod) {
  const { w, d } = footprintDims(mod.type, mod.rot)
  return mod.cx >= -HALF_PLOT && mod.cz >= -HALF_PLOT &&
    mod.cx + w <= HALF_PLOT && mod.cz + d <= HALF_PLOT
}

/** Fraction (0..1) of a module's cells that rest on a module one floor below. */
export function supportRatio(mod, occByFloor) {
  if (mod.floor <= 0) return 1
  const below = occByFloor.get(mod.floor - 1)
  if (!below) return 0
  const cells = footprintCells(mod)
  let n = 0
  for (const k of cells) if (below.has(k)) n++
  return n / cells.length
}

/**
 * Validate a candidate placement against the rest of the build.
 * Returns { ok, reason, warn }:
 *   reason ∈ 'out' | 'overlap' | 'floating' | 'unsupported' | null
 *   warn   ∈ 'cantilever' | null   (placeable, but flagged)
 */
export function validatePlacement(mod, modules, occByFloor = null) {
  if (!inBounds(mod)) return { ok: false, reason: 'out', warn: null }

  const occ = occByFloor || occupancyByFloor(modules, mod.id)
  const sameFloor = occ.get(mod.floor)
  if (sameFloor) {
    for (const k of footprintCells(mod)) {
      if (sameFloor.has(k)) return { ok: false, reason: 'overlap', warn: null }
    }
  }

  if (mod.floor > 0) {
    const r = supportRatio(mod, occ)
    if (r <= 0) return { ok: false, reason: 'floating', warn: null }
    if (r < SUPPORT_MIN) return { ok: false, reason: 'unsupported', warn: null }
    if (r < 1) return { ok: true, reason: null, warn: 'cantilever' }
  }
  return { ok: true, reason: null, warn: null }
}

export const REASON_TEXT = {
  out: 'Poza placem',
  overlap: 'Miejsce zajęte',
  floating: 'Brak podpory',
  unsupported: 'Za mało podparcia',
  cantilever: 'Wspornik — wymaga wzmocnienia',
  full: 'Osiągnięto maks. liczbę pięter',
}

/* ---- structural integrity (after edits) --------------------------------- */

/**
 * Remove modules that lost their support (e.g. after deleting a lower module),
 * cascading upward. Returns { modules, removed } — pure, never mutates input.
 */
export function pruneFloating(modules) {
  let current = modules
  const removed = []
  for (let pass = 0; pass < MAX_FLOORS + 1; pass++) {
    const occ = occupancyByFloor(current)
    const dead = current.filter((m) => m.floor > 0 && supportRatio(m, occ) < SUPPORT_MIN)
    if (!dead.length) break
    const deadIds = new Set(dead.map((m) => m.id))
    removed.push(...dead)
    current = current.filter((m) => !deadIds.has(m.id))
  }
  return { modules: current, removed }
}

/** Would deleting `id` leave anything unsupported? Returns the ids that would fall. */
export function dependentsOf(id, modules) {
  const after = modules.filter((m) => m.id !== id)
  const { removed } = pruneFloating(after)
  return removed.map((m) => m.id)
}

/* ---- exterior-wall analysis (drives façade openings in present mode) ----- */

/**
 * For a module, which of its 4 local sides face open air (no neighbour on the
 * same floor). Local sides relative to the module's own orientation:
 *   front/back = the long walls, left/right = the short end walls (rot 0).
 * Returns { front, back, left, right, top } booleans (true = exterior).
 */
export function exteriorWalls(mod, occByFloor) {
  const { w, d } = footprintDims(mod.type, mod.rot)
  const floorOcc = occByFloor.get(mod.floor) || new Set()
  const aboveOcc = occByFloor.get(mod.floor + 1) || new Set()

  const colOpen = (x, z) => !floorOcc.has(cellKey(x, z))
  // +Z side (cells at cz+d), −Z side (cz-1), +X side (cx+w), −X side (cx-1)
  const zPlus = anyOpen(mod.cx, mod.cx + w - 1, mod.cz + d, colOpen, 'z')
  const zMinus = anyOpen(mod.cx, mod.cx + w - 1, mod.cz - 1, colOpen, 'z')
  const xPlus = anyOpen(mod.cz, mod.cz + d - 1, mod.cx + w, colOpen, 'x')
  const xMinus = anyOpen(mod.cz, mod.cz + d - 1, mod.cx - 1, colOpen, 'x')

  // top is exterior if no module sits fully above any of its cells
  let top = false
  for (const k of footprintCells(mod)) { if (!aboveOcc.has(k)) { top = true; break } }

  // map world axes to the module's local orientation
  if (rotIsLengthAlongX(mod.rot)) {
    // length along X → long walls are ±Z (front/back), ends ±X (left/right)
    return { front: zPlus, back: zMinus, right: xPlus, left: xMinus, top }
  }
  // length along Z → long walls are ±X, ends ±Z
  return { front: xPlus, back: xMinus, right: zPlus, left: zMinus, top }
}

const rotIsLengthAlongX = (rot) => !rot
function anyOpen(a0, a1, fixed, colOpen, axis) {
  for (let a = a0; a <= a1; a++) {
    if (axis === 'z' ? colOpen(a, fixed) : colOpen(fixed, a)) return true
  }
  return false
}

/* ---- roof + PV geometry (building-level, per exposed column) -------------- */

/**
 * For every occupied (x,z) column, find the highest storey there. That top cell
 * is "exposed" — it gets a roof; cells beneath it are covered and never do.
 * Returns Map level → Set("x,z") of the exposed roof cells at that level.
 */
export function exposedTopCells(modules) {
  const colTop = new Map() // "x,z" → highest floor
  for (const m of modules) {
    for (const k of footprintCells(m)) {
      const cur = colTop.get(k)
      if (cur === undefined || m.floor > cur) colTop.set(k, m.floor)
    }
  }
  const byLevel = new Map()
  for (const [k, lvl] of colTop) {
    let s = byLevel.get(lvl); if (!s) { s = new Set(); byLevel.set(lvl, s) }
    s.add(k)
  }
  return byLevel
}

function cellsToGrid(cellSet) {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
  for (const k of cellSet) {
    const i = k.indexOf(','); const x = +k.slice(0, i), z = +k.slice(i + 1)
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }
  const w = maxX - minX + 1, h = maxZ - minZ + 1
  const grid = Array.from({ length: h }, () => new Array(w).fill(false))
  for (const k of cellSet) {
    const i = k.indexOf(','); const x = +k.slice(0, i), z = +k.slice(i + 1)
    grid[z - minZ][x - minX] = true
  }
  return { minX, minZ, w, h, grid }
}

/** Largest all-true axis-aligned rectangle in a boolean grid (histogram method). */
function largestRectInGrid(grid, w, h) {
  const heights = new Array(w).fill(0)
  let best = null
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) heights[c] = grid[r][c] ? heights[c] + 1 : 0
    const stack = []
    for (let c = 0; c <= w; c++) {
      const cur = c === w ? 0 : heights[c]
      let start = c
      while (stack.length && stack[stack.length - 1].h > cur) {
        const top = stack.pop()
        const area = top.h * (c - top.c)
        if (!best || area > best.area) best = { area, x0: top.c, x1: c, z0: r - top.h + 1, z1: r + 1 }
        start = top.c
      }
      stack.push({ h: cur, c: start })
    }
  }
  return best
}

/** Cover a cell set with non-overlapping rectangles, biggest first (cell coords, ends exclusive). */
function coverWithRects(cellSet) {
  const remaining = new Set(cellSet)
  const rects = []
  let guard = 0
  while (remaining.size && guard++ < 400) {
    const g = cellsToGrid(remaining)
    const r = largestRectInGrid(g.grid, g.w, g.h)
    if (!r) break
    const rect = { x0: g.minX + r.x0, x1: g.minX + r.x1, z0: g.minZ + r.z0, z1: g.minZ + r.z1 }
    rects.push(rect)
    for (let x = rect.x0; x < rect.x1; x++) for (let z = rect.z0; z < rect.z1; z++) remaining.delete(cellKey(x, z))
  }
  return rects
}

const cellRectToWorld = (r, level) => ({
  level,
  cx: (r.x0 + r.x1) / 2 * CELL,
  cz: (r.z0 + r.z1) / 2 * CELL,
  sx: (r.x1 - r.x0) * CELL,
  sz: (r.z1 - r.z0) * CELL,
  cells: (r.x1 - r.x0) * (r.z1 - r.z0),
  y: FOUNDATION_H + level * FLOOR_H + MODULE_H, // top of the module body at this storey
})

/** Roof slabs covering exactly the exposed top of the building (per storey). */
export function roofRectangles(modules) {
  const byLevel = exposedTopCells(modules)
  const out = []
  for (const [level, cells] of byLevel) {
    for (const r of coverWithRects(cells)) out.push(cellRectToWorld(r, level))
  }
  return out
}

/** The single largest flat roof rectangle in the build — where PV should go. */
export function largestRoofRect(modules) {
  const byLevel = exposedTopCells(modules)
  let best = null
  for (const [level, cells] of byLevel) {
    const g = cellsToGrid(cells)
    const r = largestRectInGrid(g.grid, g.w, g.h)
    if (!r) continue
    const rect = { x0: g.minX + r.x0, x1: g.minX + r.x1, z0: g.minZ + r.z0, z1: g.minZ + r.z1 }
    const world = cellRectToWorld(rect, level)
    if (!best || world.cells > best.cells) best = world
  }
  return best
}

/* ============================================================
   ADD-ONS — doors / windows (wall bays), solar (roof cells),
   terrace (ground cells). Strong grid physics: one element per
   slot, only on valid surfaces, auto-pruned on conflicts,
   true-to-size relative to the container grid.
   ============================================================ */

/* true-to-size openings (metres); a bay is one CELL wide (1.22 m) */
export const DOOR = { w: 1.0, h: 2.12, sill: 0.0 }
export const WINDOW = { w: 1.25, h: 1.25, sill: 0.95 }
export const SIDE_DELTA = { pz: [0, 1], mz: [0, -1], px: [1, 0], mx: [-1, 0] }
export const SIDE_RY = { pz: 0, mz: Math.PI, px: Math.PI / 2, mx: -Math.PI / 2 }
const SIDES = Object.keys(SIDE_DELTA)

/* keys identify a slot uniquely → dedup + toggle (one element per slot) */
export const bayKey = (b) => `${b.floor}:${b.x},${b.z}:${b.side}`
export const solarKey = (c) => `${c.floor}:${c.x},${c.z}`
export const terraceKey = (c) => `${c.x},${c.z}`

/** Every exterior wall bay (one CELL-wide slot) of the build. */
export function exteriorBays(modules) {
  const occ = occupancyByFloor(modules)
  const out = []
  for (const [floor, cells] of occ) {
    for (const key of cells) {
      const ci = key.indexOf(',')
      const x = +key.slice(0, ci), z = +key.slice(ci + 1)
      for (const side of SIDES) {
        const [dx, dz] = SIDE_DELTA[side]
        if (!cells.has(cellKey(x + dx, z + dz))) out.push({ x, z, side, floor })
      }
    }
  }
  return out
}

/** Is this bay still a real exterior wall (cell occupied, neighbour open)? */
export function isBayExterior(bay, occByFloor) {
  const cells = occByFloor.get(bay.floor)
  if (!cells || !cells.has(cellKey(bay.x, bay.z))) return false
  const d = SIDE_DELTA[bay.side]
  return !!d && !cells.has(cellKey(bay.x + d[0], bay.z + d[1]))
}

/** World transform of a bay's wall segment (for ghost / targeting / render). */
export function bayWorld(bay) {
  let wx = (bay.x + 0.5) * CELL, wz = (bay.z + 0.5) * CELL
  if (bay.side === 'pz') wz = (bay.z + 1) * CELL
  else if (bay.side === 'mz') wz = bay.z * CELL
  else if (bay.side === 'px') wx = (bay.x + 1) * CELL
  else if (bay.side === 'mx') wx = bay.x * CELL
  return {
    pos: [wx, FOUNDATION_H + bay.floor * FLOOR_H + MODULE_H / 2, wz],
    ry: SIDE_RY[bay.side],
    floorBottom: FOUNDATION_H + bay.floor * FLOOR_H,
    width: CELL, height: MODULE_H,
  }
}

/** Exposed roof cells where solar may sit (top of the highest module per column). */
export function roofCells(modules) {
  const byLevel = exposedTopCells(modules)
  const out = []
  for (const [floor, cells] of byLevel) {
    for (const key of cells) {
      const ci = key.indexOf(',')
      out.push({ x: +key.slice(0, ci), z: +key.slice(ci + 1), floor })
    }
  }
  return out
}

export function isRoofCell(cell, modules) {
  const cells = exposedTopCells(modules).get(cell.floor)
  return !!cells && cells.has(cellKey(cell.x, cell.z))
}

export function solarWorld(cell) {
  return { cx: (cell.x + 0.5) * CELL, cz: (cell.z + 0.5) * CELL, y: FOUNDATION_H + cell.floor * FLOOR_H + MODULE_H }
}

/** A free ground cell (storey 0 empty, inside the plot) — where terrace may sit. */
export function isGroundFree(x, z, occByFloor) {
  const half = PLOT_CELLS / 2
  if (x < -half || z < -half || x >= half || z >= half) return false
  const ground = occByFloor.get(0)
  return !(ground && ground.has(cellKey(x, z)))
}

export function terraceWorld(cell) {
  return { cx: (cell.x + 0.5) * CELL, cz: (cell.z + 0.5) * CELL, y: FOUNDATION_H }
}

/**
 * Drop add-ons that have become invalid after the containers changed:
 * openings on now-interior/removed walls, solar under a newly-stacked module,
 * terrace under a newly-placed container. Pure; returns a new project.
 */
export function pruneAddons(project) {
  const occ = occupancyByFloor(project.modules)
  const byLevel = exposedTopCells(project.modules)
  const openings = (project.openings || []).filter((o) => isBayExterior(o, occ))
  const solar = (project.solar || []).filter((c) => byLevel.get(c.floor)?.has(cellKey(c.x, c.z)))
  const terrace = (project.terrace || []).filter((c) => isGroundFree(c.x, c.z, occ))
  return { ...project, openings, solar, terrace }
}

/* ---- pricing ------------------------------------------------------------- */
export const ADDON_PRICE = { door: 1600, window: 1150, solar: 1700, terrace: 850 }

export function totalArea(modules) {
  let cells = 0
  for (const m of modules) {
    const { w, d } = footprintDims(m.type, m.rot)
    cells += w * d
  }
  return Math.round(cells * CELL * CELL)
}

export function floorsUsed(modules) {
  let max = 0
  for (const m of modules) max = Math.max(max, m.floor)
  return max + 1
}

export function computePrice(project) {
  const { modules = [], finish = {}, openings = [], solar = [], terrace = [] } = project || {}
  const tier = tierById[finish.tier] || TIERS[1]
  const area = totalArea(modules)
  const base = area * tier.pricePerM2
  const floors = floorsUsed(modules)
  const structure = floors > 1 ? (floors - 1) * 18000 : 0
  const roof = (roofById[finish.roof]?.priceAdd || 0) * Math.max(1, topModuleCount(modules))
  const doors = openings.filter((o) => o.type === 'door').length
  const windows = openings.filter((o) => o.type === 'window').length
  const addons = doors * ADDON_PRICE.door + windows * ADDON_PRICE.window +
    solar.length * ADDON_PRICE.solar + terrace.length * ADDON_PRICE.terrace
  const total = base + structure + roof + addons
  return { area, base, structure, roof, addons, floors, total, doors, windows, solar: solar.length, terrace: terrace.length }
}

function topModuleCount(modules) {
  const occ = occupancyByFloor(modules)
  let n = 0
  for (const m of modules) {
    const above = occ.get(m.floor + 1)
    const cells = footprintCells(m)
    const covered = above && cells.every((k) => above.has(k))
    if (!covered) n++
  }
  return n
}

/* ---- ids + normalisation ------------------------------------------------- */

let _seq = 0
export const nextId = () => `b${++_seq}`

/** Re-centre a module list so its footprint bounding box straddles the origin. */
export function normalizeModules(modules) {
  if (!modules.length) return modules
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
  for (const m of modules) {
    const { w, d } = footprintDims(m.type, m.rot)
    minX = Math.min(minX, m.cx); minZ = Math.min(minZ, m.cz)
    maxX = Math.max(maxX, m.cx + w); maxZ = Math.max(maxZ, m.cz + d)
  }
  const ox = Math.round((minX + maxX) / 2)
  const oz = Math.round((minZ + maxZ) / 2)
  return modules.map((m) => ({ ...m, cx: m.cx - ox, cz: m.cz - oz }))
}

/** World-space bounding box of a build: { center:[x,z], size:[x,z], height }. */
export function buildBounds(modules) {
  if (!modules.length) return { center: [0, 0], size: [6, 6], height: MODULE_H, floors: 1 }
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity, maxF = 0
  for (const m of modules) {
    const { w, d } = footprintDims(m.type, m.rot)
    minX = Math.min(minX, m.cx); minZ = Math.min(minZ, m.cz)
    maxX = Math.max(maxX, m.cx + w); maxZ = Math.max(maxZ, m.cz + d)
    maxF = Math.max(maxF, m.floor)
  }
  return {
    center: [((minX + maxX) / 2) * CELL, ((minZ + maxZ) / 2) * CELL],
    size: [(maxX - minX) * CELL, (maxZ - minZ) * CELL],
    height: FOUNDATION_H + (maxF + 1) * FLOOR_H,
    floors: maxF + 1,
  }
}

/* ---- shape presets ------------------------------------------------------- */
/* Each preset builds a fresh module list (ids assigned on load). Coordinates
   are authored in cells; modules use 20' (5×2) unless noted. Helpers below
   keep authoring terse. L = 5 cells (20' length), W = 2 cells (width). */

const L5 = 5, W2 = 2, L40 = 10

// a 20' module: row r (×2 cells), col c (×5 cells), horizontal (rot 0)
const h20 = (c, r, floor = 0) => ({ type: 'm20', cx: c * L5, cz: r * W2, floor, rot: 0 })
// a 20' module standing vertically (rot 1): spans 2 cells X, 5 cells Z
const v20 = (cx, cz, floor = 0) => ({ type: 'm20', cx, cz, floor, rot: 1 })

function rowOf20(n, r = 0, floor = 0) {
  return Array.from({ length: n }, (_, i) => h20(i, r, floor))
}

export const PRESETS = [
  {
    id: 'linear', name: 'Rzędowy', icon: 'row', floors: 1,
    desc: 'Prosty rząd modułów — najtańszy baseline',
    cladding: 'graphite', roof: 'flat',
    build: () => [h20(0, 0), h20(0, 1), h20(0, 2)],
  },
  {
    id: 'double', name: 'Blok dwurzędowy', icon: 'block', floors: 1,
    desc: 'Zwarty prostokąt — biuro, przychodnia',
    cladding: 'white', roof: 'flat',
    build: () => [...rowOf20(2, 0), ...rowOf20(2, 1), ...rowOf20(2, 2)],
  },
  {
    id: 'lshape', name: 'Kształt L', icon: 'l', floors: 1,
    desc: 'Dwa skrzydła pod kątem, osłonięty taras',
    cladding: 'wood', roof: 'flat',
    // long wing along X (3 modules), short wing turning down in Z
    build: () => [
      h20(0, 0), h20(1, 0), h20(2, 0),
      v20(0, W2), v20(0, W2 + L5),
    ],
  },
  {
    id: 'ushape', name: 'Kształt U', icon: 'u', floors: 1,
    desc: 'Trzy skrzydła wokół dziedzińca',
    cladding: 'graphite', roof: 'flat',
    build: () => [
      // base (front) row of 3
      h20(0, 0), h20(1, 0), h20(2, 0),
      // two arms going back (+Z) at the ends
      v20(0, W2), v20(0, W2 + L5),
      v20(3 * L5 - W2, W2), v20(3 * L5 - W2, W2 + L5),
    ],
  },
  {
    id: 'tshape', name: 'Kształt T', icon: 't', floors: 1,
    desc: 'Belka + trzon — rozdziela strefy',
    cladding: 'white', roof: 'gable',
    build: () => [
      h20(0, 0), h20(1, 0), h20(2, 0), h20(3, 0),
      v20(2 * L5 - W2 / 2 - 1, W2), v20(2 * L5 - W2 / 2 - 1, W2 + L5),
    ],
  },
  {
    id: 'courtyard', name: 'Dziedziniec', icon: 'o', floors: 1,
    desc: 'Zamknięty pierścień wokół atrium',
    cladding: 'graphite', roof: 'flat',
    // a gap-free rectangular ring (hollow x[2..8) z[2..7)) of six 20' modules
    build: () => [
      { type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 }, // front edge
      { type: 'm20', cx: 5, cz: 0, floor: 0, rot: 0 },
      { type: 'm20', cx: 0, cz: 7, floor: 0, rot: 0 }, // back edge
      { type: 'm20', cx: 5, cz: 7, floor: 0, rot: 0 },
      { type: 'm20', cx: 0, cz: 2, floor: 0, rot: 1 }, // left arm
      { type: 'm20', cx: 8, cz: 2, floor: 0, rot: 1 }, // right arm
    ],
  },
  {
    id: 'stacked', name: 'Piętrowy 2×2', icon: 'stack', floors: 2,
    desc: 'Parter 2×2 i identyczne piętro',
    cladding: 'graphite', roof: 'flat',
    build: () => [
      ...rowOf20(2, 0, 0), ...rowOf20(2, 1, 0),
      ...rowOf20(2, 0, 1), ...rowOf20(2, 1, 1),
    ],
  },
  {
    id: 'setback', name: 'Piętro cofnięte', icon: 'setback', floors: 2,
    desc: 'Taras na cofniętym piętrze',
    cladding: 'wood', roof: 'flat',
    build: () => [
      // ground 3×2
      ...rowOf20(3, 0, 0), ...rowOf20(3, 1, 0),
      // upper 2×2 pulled back from the front row
      h20(0, 1, 1), h20(1, 1, 1),
      h20(0, 0, 1), h20(1, 0, 1),
    ],
  },
  {
    id: 'cantilever', name: 'Wspornik', icon: 'cant', floors: 2,
    desc: 'Górny moduł na wysięgu — zadaszenie',
    cladding: 'graphite', roof: 'flat',
    build: () => [
      // ground: two 40' side by side
      { type: 'm40', cx: 0, cz: 0, floor: 0, rot: 0 },
      { type: 'm40', cx: 0, cz: W2, floor: 0, rot: 0 },
      // upper 40' shifted +X so ~30% overhangs (cantilever)
      { type: 'm40', cx: 3, cz: 0, floor: 1, rot: 0 },
      { type: 'm40', cx: 3, cz: W2, floor: 1, rot: 0 },
    ],
  },
  {
    id: 'storage', name: 'Self-storage', icon: 'storage', floors: 1,
    desc: 'Dwa rzędy boksów z aleją',
    cladding: 'white', roof: 'flat',
    build: () => [
      ...rowOf20(5, 0, 0),
      ...rowOf20(5, 2, 0), // gap row (alley) between r=0 and r=2
    ],
  },
  {
    id: 'showroom', name: 'Salon / showroom', icon: 'glass', floors: 1,
    desc: 'Długie przeszklone przęsła',
    cladding: 'graphite', roof: 'parapet',
    build: () => [
      { type: 'm40', cx: 0, cz: 0, floor: 0, rot: 0 },
      { type: 'm40', cx: 0, cz: W2, floor: 0, rot: 0 },
      { type: 'm40', cx: 0, cz: W2 * 2, floor: 0, rot: 0 },
    ],
  },
  {
    id: 'tower', name: 'Wieża 3 piętra', icon: 'tower', floors: 3,
    desc: 'Kompaktowy hotel / biuro na małej działce',
    cladding: 'graphite', roof: 'flat',
    build: () => [
      ...rowOf20(2, 0, 0), ...rowOf20(2, 1, 0),
      ...rowOf20(2, 0, 1), ...rowOf20(2, 1, 1),
      ...rowOf20(2, 0, 2), ...rowOf20(2, 1, 2),
    ],
  },
]

export const presetById = Object.fromEntries(PRESETS.map((p) => [p.id, p]))

/** Build a fresh, id-stamped, normalised, validated module list from a preset. */
export function modulesFromPreset(preset) {
  const raw = (preset.build() || []).map((m) => ({ ...m, id: nextId() }))
  return normalizeModules(raw)
}
