/* Pure-logic self-test for src/data/builder.js — run with `node`.
   Validates presets (no overlap / supported / in bounds) and the core
   placement-physics helpers. No DOM, no three.js. */
import {
  PRESETS, modulesFromPreset, footprintDims, footprintCells, occupancyByFloor,
  validatePlacement, supportRatio, inBounds, pruneFloating, dependentsOf,
  exteriorWalls, worldPosition, buildBounds, MAX_FLOORS, SUPPORT_MIN, nextId,
  CELL, exposedTopCells, roofRectangles, largestRoofRect,
  exteriorBays, isBayExterior, bayWorld, roofCells, isRoofCell, isGroundFree,
  pruneAddons, computePrice, bayKey, MODULE_H, FOUNDATION_H,
} from '../src/data/builder.js'

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) { pass++ } else { fail++; console.error('  ✗ ' + msg) } }
const section = (s) => console.log('\n• ' + s)

/* ---- 1. every preset must be structurally valid ---- */
section('Presety — kolizje / podparcie / granice / piętra')
for (const p of PRESETS) {
  const mods = modulesFromPreset(p)
  ok(mods.length > 0, `${p.id}: niepusty (${mods.length} mod.)`)

  // no overlap on any floor
  const occCount = new Map()
  let overlap = false
  for (const m of mods) for (const k of footprintCells(m)) {
    const key = m.floor + ':' + k
    occCount.set(key, (occCount.get(key) || 0) + 1)
    if (occCount.get(key) > 1) overlap = true
  }
  ok(!overlap, `${p.id}: brak nakładania`)

  // bounds
  ok(mods.every(inBounds), `${p.id}: w granicach placu`)

  // support: every upper module ≥ SUPPORT_MIN
  const occ = occupancyByFloor(mods)
  const floaters = mods.filter((m) => m.floor > 0 && supportRatio(m, occ) < SUPPORT_MIN)
  ok(floaters.length === 0, `${p.id}: wszystkie piętra podparte (${floaters.length} wiszących)`)

  // floors within limit
  const maxF = Math.max(...mods.map((m) => m.floor))
  ok(maxF < MAX_FLOORS, `${p.id}: piętra ≤ ${MAX_FLOORS} (max idx ${maxF})`)

  // declared floors match
  ok(maxF + 1 === p.floors, `${p.id}: deklarowane piętra=${p.floors} == realne=${maxF + 1}`)

  // pruneFloating must be a no-op on a valid preset
  const { removed } = pruneFloating(mods)
  ok(removed.length === 0, `${p.id}: pruneFloating nic nie usuwa (${removed.length})`)
}

/* ---- 2. footprint + rotation ---- */
section('Footprint i rotacja')
ok(JSON.stringify(footprintDims('m20', 0)) === JSON.stringify({ w: 5, d: 2 }), '20\' rot0 = 5×2')
ok(JSON.stringify(footprintDims('m20', 1)) === JSON.stringify({ w: 2, d: 5 }), '20\' rot1 = 2×5')
ok(JSON.stringify(footprintDims('m40', 0)) === JSON.stringify({ w: 10, d: 2 }), '40\' rot0 = 10×2')
ok(footprintCells({ type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 }).length === 10, '20\' zajmuje 10 komórek')

/* ---- 3. validatePlacement ---- */
section('Walidacja placement')
const base = [{ id: 'a', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 }]
ok(validatePlacement({ id: 'x', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 }, base).reason === 'overlap', 'nakładanie → overlap')
ok(validatePlacement({ id: 'x', type: 'm20', cx: 0, cz: 2, floor: 0, rot: 0 }, base).ok, 'obok → ok')
ok(validatePlacement({ id: 'x', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 }, base).ok, 'piętro nad pełnym → ok')
ok(validatePlacement({ id: 'x', type: 'm20', cx: 8, cz: 0, floor: 1, rot: 0 }, base).reason === 'floating', 'piętro nad pustką → floating')
ok(validatePlacement({ id: 'x', type: 'm40', cx: 999, cz: 0, floor: 0, rot: 0 }, base).reason === 'out', 'poza placem → out')

// cantilever warning: upper 20' 60% over a 20' base (ratio 0.6 ≥ 0.5)
const cant = validatePlacement({ id: 'x', type: 'm20', cx: 2, cz: 0, floor: 1, rot: 0 }, base)
ok(cant.ok && cant.warn === 'cantilever', `wspornik 60% nad → ok+cantilever (ratio ${supportRatio({ type: 'm20', cx: 2, cz: 0, floor: 1, rot: 0 }, occupancyByFloor(base)).toFixed(2)})`)

// too little support → unsupported (only 1/10 cells over base)
const us = validatePlacement({ id: 'x', type: 'm20', cx: 4, cz: 0, floor: 1, rot: 0 }, base)
ok(!us.ok && us.reason === 'unsupported', 'wysięg >50% → unsupported')

/* ---- 4. pruneFloating cascade ---- */
section('Kaskada pruneFloating')
const tower = [
  { id: 'g', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'm', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 },
  { id: 't', type: 'm20', cx: 0, cz: 0, floor: 2, rot: 0 },
]
const afterDel = tower.filter((m) => m.id !== 'g')
const pr = pruneFloating(afterDel)
ok(pr.modules.length === 0 && pr.removed.length === 2, 'usunięcie parteru zwala całą wieżę (kaskada)')
ok(JSON.stringify(dependentsOf('g', tower).sort()) === JSON.stringify(['m', 't']), 'dependentsOf parteru = [m,t]')
ok(dependentsOf('t', tower).length === 0, 'dependentsOf szczytu = []')

/* ---- 4b. erase scenarios (mirrors app eraseModule = filter + pruneFloating) ---- */
section('Usuwanie — każdy scenariusz')
const erase = (mods, id) => pruneFloating(mods.filter((m) => m.id !== id)).modules
// flat row: erase middle → neighbours intact
const row3 = [
  { id: 'a', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'b', type: 'm20', cx: 0, cz: 2, floor: 0, rot: 0 },
  { id: 'c', type: 'm20', cx: 0, cz: 4, floor: 0, rot: 0 },
]
ok(erase(row3, 'b').length === 2, 'rząd: usunięcie środkowego zostawia 2')
ok(erase(row3, 'b').every((m) => m.id !== 'b'), 'rząd: usunięty to właśnie b')
// top of stack → only it
const stk = [
  { id: 'g', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'u', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 },
]
ok(erase(stk, 'u').length === 1 && erase(stk, 'u')[0].id === 'g', 'stos: usunięcie szczytu zostawia parter')
ok(erase(stk, 'g').length === 0, 'stos: usunięcie parteru kaskadowo usuwa górny')
// erase one of two supports under an upper that still has ≥50% → upper stays
const wide = [
  { id: 'p', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'q', type: 'm20', cx: 5, cz: 0, floor: 0, rot: 0 },
  { id: 'top', type: 'm40', cx: 0, cz: 0, floor: 1, rot: 0 }, // 40' spans both
]
ok(erase(wide, 'q').length === 2, 'usunięcie jednej z dwóch podpór: górny 50% wsparty → zostaje')
ok(erase(wide, 'q').some((m) => m.id === 'top'), 'górny 40\' przetrwał (oparty na p)')

/* ---- 5. exteriorWalls ---- */
section('Ściany zewnętrzne (neighbor-aware)')
const pair = [
  { id: 'a', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'b', type: 'm20', cx: 0, cz: 2, floor: 0, rot: 0 }, // sits on +Z long wall of a
]
const occ2 = occupancyByFloor(pair)
const ea = exteriorWalls(pair[0], occ2)
ok(ea.front === false, 'a: ściana +Z wewnętrzna (sąsiad b)')
ok(ea.back === true && ea.left === true && ea.right === true, 'a: pozostałe długie/krótkie zewnętrzne')
ok(ea.top === true, 'a: dach odsłonięty (brak piętra)')

/* ---- 6. worldPosition / buildBounds sanity ---- */
section('Pozycje świata')
const wp = worldPosition({ type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 })
ok(Math.abs(wp[0] - 2.5 * CELL) < 1e-9 && Math.abs(wp[2] - 1 * CELL) < 1e-9, `środek 20'@(0,0) = (${(2.5 * CELL).toFixed(2)},_,${CELL.toFixed(2)}) [${wp.map((n) => n.toFixed(2))}]`)
const bb = buildBounds(modulesFromPreset(PRESETS[0]))
ok(bb.size[0] > 0 && bb.size[1] > 0, 'buildBounds rozmiar > 0')

/* ---- 7. roof + PV: no roof under stacked modules ---- */
section('Dach i PV (per-kolumna)')
// a 2-storey stack: ground (0,0,f0) + upper exactly above (0,0,f1)
const stack2 = [
  { id: 'g', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'u', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 },
]
const etc = exposedTopCells(stack2)
ok(!etc.has(0), 'stack: parter NIE ma odsłoniętego dachu (jest pod modułem)')
ok(etc.get(1)?.size === 10, 'stack: dach tylko na górnym module (10 komórek)')

// setback: ground 2 wide (cz 0..2 and 2..4), upper only over cz 0..2
const setb = [
  { id: 'a', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'b', type: 'm20', cx: 0, cz: 2, floor: 0, rot: 0 },
  { id: 'c', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 },
]
const setbCells = exposedTopCells(setb)
ok(setbCells.get(0)?.size === 10, 'setback: odsłonięty taras na parterze nad modułem b (10 komórek na L0)')
ok(setbCells.get(1)?.size === 10, 'setback: dach na górnym module (10 komórek na L1)')

// roofRectangles covers exactly all exposed cells, none overlapping
const rects = roofRectangles(setb)
let roofArea = 0; const seen = new Set(); let roofOverlap = false
for (const r of rects) {
  const cellsX = Math.round(r.sx / CELL), cellsZ = Math.round(r.sz / CELL)
  roofArea += cellsX * cellsZ
}
ok(roofArea === 20, `setback: dachy pokrywają dokładnie 20 odsłoniętych komórek (=${roofArea})`)

// largestRoofRect picks the biggest flat block
const big = [
  ...Array.from({ length: 3 }, (_, i) => ({ id: 'r' + i, type: 'm20', cx: 0, cz: i * 2, floor: 0, rot: 0 })), // 3×20' block = 5×6 cells
  { id: 's', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 1 }, // a small upper bit
]
const lr = largestRoofRect(big)
ok(lr && lr.cells >= 10, `largestRoofRect zwraca duży blok (cells=${lr?.cells})`)

/* ---- 8. ADD-ONS: bays / solar / terrace + grid physics ---- */
section('Add-ony — przęsła / PV / taras + fizyka gridu')
const oneMod = [{ id: 'm', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 }] // 5×2 cells
const bays = exteriorBays(oneMod)
ok(bays.length === 14, `pojedynczy 20' ma 14 przęseł zewn. (perymetr 5×2 = 2·5+2·2; =${bays.length})`)
const occA = occupancyByFloor(oneMod)
ok(bays.every((b) => isBayExterior(b, occA)), 'wszystkie przęsła pojedynczego modułu są zewnętrzne')
// add a neighbour on +Z → the shared wall bays become interior
const twoMods = [...oneMod, { id: 'n', type: 'm20', cx: 0, cz: 2, floor: 0, rot: 0 }]
const occB = occupancyByFloor(twoMods)
const sharedBay = { x: 0, z: 1, side: 'pz', floor: 0 } // was exterior on the single module
ok(isBayExterior(sharedBay, occA) && !isBayExterior(sharedBay, occB), 'dostawienie sąsiada robi wspólną ścianę wewnętrzną')

// bayWorld geometry sane
const bw = bayWorld({ x: 0, z: 0, side: 'mz', floor: 0 })
ok(Math.abs(bw.pos[2] - 0) < 1e-9 && Math.abs(bw.pos[1] - (FOUNDATION_H + MODULE_H / 2)) < 1e-9, 'bayWorld -Z: na ścianie z=0, na środku wysokości')

// roof + solar
const stackPV = [
  { id: 'g', type: 'm20', cx: 0, cz: 0, floor: 0, rot: 0 },
  { id: 'u', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 },
]
ok(roofCells(stackPV).length === 10 && roofCells(stackPV).every((c) => c.floor === 1), 'PV-grid: tylko 10 komórek na górnym module')
ok(isRoofCell({ x: 0, z: 0, floor: 1 }, stackPV) && !isRoofCell({ x: 0, z: 0, floor: 0 }, stackPV), 'komórka PV ważna tylko na odsłoniętym wierzchu')

// terrace ground-free
ok(!isGroundFree(0, 0, occA), 'grunt pod kontenerem zajęty (brak tarasu)')
ok(isGroundFree(0, 3, occA), 'wolny grunt obok = taras dozwolony')

/* ---- 9. pruneAddons auto-cleanup (conflicts) ---- */
section('Auto-czyszczenie add-onów przy konflikcie')
const proj = {
  modules: oneMod,
  openings: [
    { x: 0, z: 1, side: 'pz', floor: 0, type: 'window' },  // exterior now
    { x: 0, z: 0, side: 'mz', floor: 0, type: 'door' },    // exterior
  ],
  solar: [{ x: 0, z: 0, floor: 0 }],   // valid: exposed roof of the single module
  terrace: [{ x: 0, z: 3 }, { x: 0, z: 0 }], // (0,0) is UNDER the container → invalid
  finish: {},
}
const p0 = pruneAddons(proj)
ok(p0.openings.length === 2 && p0.solar.length === 1, 'bez zmian: ważne add-ony zostają')
ok(p0.terrace.length === 1 && p0.terrace[0].z === 3, 'taras pod kontenerem usunięty, wolny zostaje')
// now stack a module on top + add the +Z neighbour → solar invalid + window interior
const proj2 = { ...proj, modules: twoMods.concat({ id: 't', type: 'm20', cx: 0, cz: 0, floor: 1, rot: 0 }) }
const p1 = pruneAddons(proj2)
ok(!p1.openings.some((o) => o.x === 0 && o.z === 1 && o.side === 'pz'), 'okno na ścianie, która stała się wewnętrzna → usunięte')
ok(p1.solar.length === 0, 'PV na module przykrytym piętrem → usunięte')

/* ---- 10. pricing by element ---- */
section('Wycena po elementach')
const price = computePrice(proj)
ok(price.doors === 1 && price.windows === 1 && price.terrace === 2 && price.solar === 1, 'computePrice zlicza elementy')
ok(price.total > price.base, 'add-ony podnoszą cenę')

/* ---- summary ---- */
console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
