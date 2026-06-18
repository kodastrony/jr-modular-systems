/* ============================================================
   Configurator catalog
   Drives both the module palette (UI) and the procedural 3D
   models. Prices reuse the real standard tiers from the site
   (od 1999 / 2299 / 2999 zł netto za m²).
   ============================================================ */

/* ---- container body sizes (metres) ---- */
export const SIZES = [
  { id: '20', name: "20' · 6,06 m", L: 6.06, W: 2.44, H: 2.6 },
  { id: '30', name: "30' · 9,12 m", L: 9.12, W: 2.44, H: 2.6 },
  { id: '40', name: "40' · 12,19 m", L: 12.19, W: 2.44, H: 2.6 },
]
export const sizeById = Object.fromEntries(SIZES.map((s) => [s.id, s]))

/* ---- module variants (front-face openings) ----
   x = position along the long (front) wall, fraction of usable half-length (-1..1)
   types: solid | door | doubleDoor | window | windowBand | shopfront | glazed | rollup | open
*/
export const VARIANTS = [
  { id: 'blank', name: 'Kontener', desc: 'Goły moduł', priceAdd: 0, group: 'Bazowe', openings: [] },
  { id: 'door', name: 'Drzwi', desc: 'Wejście serwisowe', priceAdd: 1400, group: 'Bazowe', openings: [{ type: 'door', x: 0 }] },
  { id: 'window', name: 'Okno', desc: 'Pojedyncze okno', priceAdd: 1100, group: 'Bazowe', openings: [{ type: 'window', x: 0 }] },
  { id: 'door-window', name: 'Drzwi + okno', desc: 'Wejście i doświetlenie', priceAdd: 2300, group: 'Bazowe', openings: [{ type: 'door', x: -0.42 }, { type: 'window', x: 0.4 }] },
  { id: 'windows', name: 'Dwa okna', desc: 'Pas doświetlenia', priceAdd: 2100, group: 'Bazowe', openings: [{ type: 'window', x: -0.45 }, { type: 'window', x: 0.45 }] },
  { id: 'window-band', name: 'Okna pasmowe', desc: 'Wstęga okien', priceAdd: 3600, group: 'Mieszkalne', openings: [{ type: 'windowBand', x: 0 }] },
  { id: 'residential', name: 'Mieszkalny', desc: 'Drzwi + 2 okna', priceAdd: 3200, group: 'Mieszkalne', openings: [{ type: 'window', x: -0.55 }, { type: 'door', x: -0.05 }, { type: 'window', x: 0.5 }] },
  { id: 'shopfront', name: 'Witryna', desc: 'Sklep / usługi', priceAdd: 4200, group: 'Handel', openings: [{ type: 'shopfront', x: 0.18 }, { type: 'door', x: -0.6 }] },
  { id: 'glazed', name: 'Przeszklenie', desc: 'Ściana szklana', priceAdd: 6500, group: 'Handel', openings: [{ type: 'glazed', x: 0 }] },
  { id: 'corner', name: 'Narożnik szklany', desc: 'Salon / ekspozycja', priceAdd: 7800, group: 'Handel', corner: true, openings: [{ type: 'glazed', x: 0 }] },
  { id: 'open', name: 'Lada / bar', desc: 'Otwarte podawanie', priceAdd: 3400, group: 'Gastro', openings: [{ type: 'open', x: 0.2 }, { type: 'door', x: -0.62 }] },
  { id: 'rollup', name: 'Brama', desc: 'Warsztat / magazyn', priceAdd: 4800, group: 'Techniczne', openings: [{ type: 'rollup', x: 0 }] },
  { id: 'double-door', name: 'Drzwi 2-skrz.', desc: 'Szerokie wejście', priceAdd: 2600, group: 'Techniczne', openings: [{ type: 'doubleDoor', x: 0 }] },
  { id: 'louver', name: 'Serwerownia', desc: 'Czerpnie / żaluzje', priceAdd: 3000, group: 'Techniczne', openings: [{ type: 'door', x: -0.55 }, { type: 'louver', x: 0.3 }] },
]
export const variantById = Object.fromEntries(VARIANTS.map((v) => [v.id, v]))
export const variantGroups = [...new Set(VARIANTS.map((v) => v.group))]

/* ---- exterior cladding ---- */
export const CLADDINGS = [
  { id: 'graphite', name: 'Stal grafit', kind: 'corrugated', color: '#3b3e44' },
  { id: 'anthracite', name: 'Antracyt', kind: 'corrugated', color: '#26282d' },
  { id: 'white', name: 'Biel', kind: 'corrugated', color: '#e9e8e4' },
  { id: 'silver', name: 'Srebrny', kind: 'corrugated', color: '#aeb2b6' },
  { id: 'rust', name: 'Ceglasta czerwień', kind: 'corrugated', color: '#9c3f30' },
  { id: 'olive', name: 'Oliwka', kind: 'corrugated', color: '#5a5f44' },
  { id: 'sand', name: 'Piaskowy', kind: 'corrugated', color: '#c9b896' },
  { id: 'wood', name: 'Drewno', kind: 'wood', color: '#b07a41' },
  { id: 'wood-dark', name: 'Drewno ciemne', kind: 'wood', color: '#6e4a2c' },
  { id: 'panel', name: 'Panel kompozyt', kind: 'panel', color: '#41464d' },
  { id: 'render', name: 'Tynk biały', kind: 'render', color: '#eceae4' },
  { id: 'render-dark', name: 'Tynk grafit', kind: 'render', color: '#4a4d52' },
]
export const claddingById = Object.fromEntries(CLADDINGS.map((c) => [c.id, c]))

/* ---- roof ---- */
export const ROOFS = [
  { id: 'flat', name: 'Płaski', priceAdd: 0 },
  { id: 'parapet', name: 'Z attyką', priceAdd: 3500 },
  { id: 'gable', name: 'Dwuspadowy', priceAdd: 9000 },
]
export const roofById = Object.fromEntries(ROOFS.map((r) => [r.id, r]))

/* ---- add-ons (global) ---- */
export const ADDONS = [
  { id: 'terrace', name: 'Taras', priceAdd: 12000, icon: 'deck' },
  { id: 'canopy', name: 'Zadaszenie', priceAdd: 6500, icon: 'canopy' },
  { id: 'stairs', name: 'Schody', priceAdd: 4200, icon: 'stairs' },
  { id: 'pergola', name: 'Pergola', priceAdd: 5200, icon: 'pergola' },
  { id: 'ac', name: 'Klimatyzacja', priceAdd: 5500, icon: 'ac' },
  { id: 'solar', name: 'Panele PV', priceAdd: 14000, icon: 'solar' },
  { id: 'smart', name: 'SMART', priceAdd: 7800, icon: 'smart' },
]
export const addonById = Object.fromEntries(ADDONS.map((a) => [a.id, a]))

/* ---- standard / quality tiers (real prices from the site) ---- */
export const TIERS = [
  { id: 'eco', name: 'Ekonomiczny', pricePerM2: 1999, desc: 'Min. standardowych przeszkleń PVC, podstawowe materiały, marketowa wykładzina winylowa, podstawowa instalacja elektryczna.' },
  { id: 'plus', name: 'Podstawowy+', pricePerM2: 2299, desc: 'Duże przeszklenia, dobra izolacja cieplna, sprawdzone jakościowo materiały budowlane.' },
  { id: 'premium', name: 'Premium', pricePerM2: 2999, desc: 'Pełne przeszklenia, izolacja spełniająca normy, materiały z wysokiej półki jakościowej.' },
]
export const tierById = Object.fromEntries(TIERS.map((t) => [t.id, t]))

/* ---- building-type presets (starter layouts) ----
   The client emphasised: domy, przedszkola, salony samochodowe.
   Each preset spawns a starter set of modules + finish defaults.
*/
export const PRESETS = [
  { id: 'salon', name: 'Salon samochodowy', icon: 'maly_sklep.png', tier: 'premium', cladding: 'graphite', roof: 'parapet',
    modules: [{ v: 'corner', s: '40' }, { v: 'glazed', s: '40' }, { v: 'door', s: '20' }] },
  { id: 'dom', name: 'Dom / domek', icon: 'domek_letniskowy.png', tier: 'plus', cladding: 'wood', roof: 'gable',
    modules: [{ v: 'residential', s: '40' }, { v: 'window-band', s: '20' }] },
  { id: 'przedszkole', name: 'Przedszkole', icon: 'sportowy.png', tier: 'plus', cladding: 'white', roof: 'gable',
    modules: [{ v: 'windows', s: '40' }, { v: 'door-window', s: '40' }, { v: 'window-band', s: '20' }] },
  { id: 'biuro', name: 'Biuro', icon: 'sales.png', tier: 'plus', cladding: 'anthracite', roof: 'flat',
    modules: [{ v: 'window-band', s: '40' }, { v: 'door-window', s: '20' }] },
  { id: 'gastro', name: 'Gastronomia / bar', icon: 'gastro.png', tier: 'plus', cladding: 'rust', roof: 'flat',
    modules: [{ v: 'open', s: '20' }, { v: 'shopfront', s: '20' }] },
  { id: 'sklep', name: 'Sklep / handel', icon: 'maly_sklep.png', tier: 'eco', cladding: 'white', roof: 'parapet',
    modules: [{ v: 'shopfront', s: '40' }, { v: 'door', s: '20' }] },
  { id: 'hotel', name: 'Hotel modułowy', icon: 'hotel.png', tier: 'plus', cladding: 'panel', roof: 'flat',
    modules: [{ v: 'window', s: '20' }, { v: 'window', s: '20' }, { v: 'door-window', s: '20' }] },
  { id: 'magazyn', name: 'Self storage', icon: 'magazyn.png', tier: 'eco', cladding: 'silver', roof: 'flat',
    modules: [{ v: 'rollup', s: '40' }, { v: 'double-door', s: '20' }] },
  { id: 'serwer', name: 'Serwerownia', icon: 'serwer.png', tier: 'premium', cladding: 'graphite', roof: 'flat',
    modules: [{ v: 'louver', s: '20' }] },
  { id: 'sauna', name: 'Sauna / wellness', icon: 'sauna.png', tier: 'premium', cladding: 'wood-dark', roof: 'flat',
    modules: [{ v: 'glazed', s: '20' }, { v: 'door', s: '20' }] },
  { id: 'silownia', name: 'Siłownia', icon: 'silownia.png', tier: 'plus', cladding: 'anthracite', roof: 'flat',
    modules: [{ v: 'window-band', s: '40' }, { v: 'door', s: '20' }] },
  { id: 'inny', name: 'Inny obiekt', icon: 'inne.png', tier: 'plus', cladding: 'graphite', roof: 'flat',
    modules: [{ v: 'door-window', s: '20' }] },
]

/* unique id generator that is deterministic-friendly (no Math.random in module init) */
let _seq = 0
export const nextId = () => `m${++_seq}`

/* spawn a fresh placed-module list from a preset */
export function modulesFromPreset(preset) {
  return preset.modules.map((m) => ({ id: nextId(), variant: m.v, size: m.s }))
}

/* ---- price computation ---- */
export function computePrice(state) {
  const tier = tierById[state.tier] || TIERS[0]
  let area = 0
  let openingsCost = 0
  for (const m of state.modules) {
    const s = sizeById[m.size]
    const v = variantById[m.variant]
    if (!s || !v) continue
    area += s.L * s.W
    openingsCost += v.priceAdd
    if (v.corner) area += 0 // corner glazing handled via openingsCost
  }
  const baseM2 = Math.round(area)
  const base = baseM2 * tier.pricePerM2
  const roof = (roofById[state.roof]?.priceAdd || 0) * Math.max(1, state.modules.length)
  const addons = state.addons.reduce((sum, id) => sum + (addonById[id]?.priceAdd || 0), 0)
  const total = base + openingsCost + roof + addons
  return { area: baseM2, base, openingsCost, roof, addons, total }
}

export const fmtPLN = (n) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' zł'
