import * as THREE from 'three'

/* ============================================================
   Procedural canvas textures — no external image assets.
   Each cladding kind ships a {map, bump} pair: a flat-ish tinted
   colour map plus a height/bump map so real lighting carves the
   ribs, planks and seams. No emissive / glow anywhere.
   ============================================================ */

function canvasOf(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}
function toTex(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 16
  // explicit trilinear mipmapping — kills the texture shimmer/flicker ("miganie")
  // when the camera moves, on every textured surface
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

/* ------------------------------------------------------------------
   IMPORTANT — colour fidelity. Every cladding map below is kept
   LUMINANCE-NEUTRAL (near-white, ~0.90–0.97 grey) so the material's
   `color` reads as the TRUE albedo instead of being multiplied down
   into mud. All the surface character (ribs, planks, seams, stucco
   grain) is carried by the BUMP map, with only the faintest albedo
   shading in the grooves for depth. Result: graphite reads as real
   anthracite, white reads clean, woods stay warm — not muddy.
   ------------------------------------------------------------------ */

/* trapezoidal / corrugated steel: near-white colour + sinusoidal rib bump.
   Dimensions are power-of-two so mipmaps generate cleanly (no rib shimmer). */
function corrugated() {
  const W = 512, H = 256, ribs = 22, rw = W / ribs
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#f3f3f3'; x.fillRect(0, 0, W, H)
  // faint groove shading aligned with the ribs — gives painted-steel depth
  // without darkening the overall albedo (stays ~0.93 luminance)
  for (let px = 0; px < W; px++) {
    const ph = (px / rw) * Math.PI * 2
    const s = Math.max(-1, Math.min(1, Math.sin(ph) * 1.25))      // -1..1 across the rib
    const v = Math.round(243 - 16 * (1 - (s * 0.5 + 0.5)))         // grooves ~227, crests ~243
    x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(px, 0, 1, H)
  }
  for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.012})`; x.fillRect(Math.random() * W, Math.random() * H, 2, 1) }
  // a faint horizontal panel seam (module joint)
  x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(0, H * 0.5 - 1, W, 2)

  const bc = canvasOf(W, H), b = bc.getContext('2d')
  for (let px = 0; px < W; px++) {
    const ph = (px / rw) * Math.PI * 2
    // rounded-trapezoid profile via clamped sine
    const v = Math.round(128 + 118 * Math.max(-1, Math.min(1, Math.sin(ph) * 1.3)))
    b.fillStyle = `rgb(${v},${v},${v})`; b.fillRect(px, 0, 1, H)
  }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* horizontal timber planks: near-white colour (so the wood tint reads true)
   + plank-gap & grain bump. Board-to-board lightness variation is kept very
   subtle so the chosen wood colour stays clean and warm. */
function wood() {
  const W = 256, H = 512, planks = 7, ph = H / planks
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#f1efec'; x.fillRect(0, 0, W, H)
  for (let i = 0; i < planks; i++) {
    // subtle per-board lightness variation around a near-white base (~0.92)
    const base = 232 + Math.random() * 16
    x.fillStyle = `rgb(${base | 0},${(base - 2) | 0},${(base - 5) | 0})`
    x.fillRect(0, i * ph, W, ph)
    // fine grain streaks — low-opacity so they only tint, never muddy
    for (let s = 0; s < 34; s++) {
      x.strokeStyle = `rgba(60,40,24,${Math.random() * 0.05})`
      x.lineWidth = Math.random() * 1.1
      const yy = i * ph + Math.random() * ph
      x.beginPath(); x.moveTo(0, yy)
      x.bezierCurveTo(80, yy + (Math.random() - 0.5) * 5, 170, yy + (Math.random() - 0.5) * 5, W, yy)
      x.stroke()
    }
  }
  // soft shadow gaps between boards in the albedo (kept light)
  for (let i = 0; i <= planks; i++) { x.fillStyle = 'rgba(40,28,18,0.16)'; x.fillRect(0, i * ph - 1, W, 2) }

  const bc = canvasOf(W, H), b = bc.getContext('2d')
  b.fillStyle = '#8f8f8f'; b.fillRect(0, 0, W, H)
  for (let i = 0; i <= planks; i++) { b.fillStyle = '#161616'; b.fillRect(0, i * ph - 2, W, 4) }
  for (let s = 0; s < 220; s++) { b.strokeStyle = `rgba(255,255,255,${Math.random() * 0.16})`; b.lineWidth = 0.6; const yy = Math.random() * H; b.beginPath(); b.moveTo(0, yy); b.lineTo(W, yy); b.stroke() }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* flat composite / cassette panels: near-white colour + crisp seam bump */
function panel() {
  const S = 256
  const cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, S, S)
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.01})`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  // faint shadow lines in the seams (albedo) so cassette joints read on flat light
  x.strokeStyle = 'rgba(0,0,0,0.08)'; x.lineWidth = 2
  for (let i = 0; i <= S; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke() }
  for (let i = 0; i <= S; i += 85) { x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke() }

  const bc = canvasOf(S, S), b = bc.getContext('2d')
  b.fillStyle = '#9a9a9a'; b.fillRect(0, 0, S, S)
  b.strokeStyle = '#161616'; b.lineWidth = 4
  for (let i = 0; i <= S; i += 128) { b.beginPath(); b.moveTo(i, 0); b.lineTo(i, S); b.stroke() }
  for (let i = 0; i <= S; i += 85) { b.beginPath(); b.moveTo(0, i); b.lineTo(S, i); b.stroke() }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* fine render / stucco: near-white colour + fine grain bump */
function render() {
  const S = 128
  const cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#f4f4f3'; x.fillRect(0, 0, S, S)
  for (let i = 0; i < 5000; i++) { const d = Math.random() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${d},${d},${d},${Math.random() * 0.025})`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  const bc = canvasOf(S, S), b = bc.getContext('2d')
  b.fillStyle = '#888'; b.fillRect(0, 0, S, S)
  for (let i = 0; i < 5200; i++) { const d = (Math.random() * 255) | 0; b.fillStyle = `rgba(${d},${d},${d},0.4)`; b.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* monocrystalline PV module — aluminium frame + dark blue cell grid with busbars.
   Used with a white material colour so these baked tones read true; the low-rough
   metallic material + env reflection then supply the characteristic blue glass sheen. */
function solar() {
  const S = 256, c = canvasOf(S, S), x = c.getContext('2d')
  // aluminium frame
  x.fillStyle = '#969ca4'; x.fillRect(0, 0, S, S)
  // dark glass field inset
  const m = 9
  x.fillStyle = '#0e1626'; x.fillRect(m, m, S - 2 * m, S - 2 * m)
  const cols = 6, rows = 6, gap = 3
  const field = S - 2 * m, cw = field / cols
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cx = m + i * cw + gap / 2, cy = m + j * cw + gap / 2, s = cw - gap
    // subtle radial sheen per monocrystalline cell
    const g = x.createLinearGradient(cx, cy, cx + s, cy + s)
    g.addColorStop(0, '#1a2740'); g.addColorStop(0.5, '#141f36'); g.addColorStop(1, '#101a2e')
    x.fillStyle = g; x.fillRect(cx, cy, s, s)
    // clipped corners hint (monocrystalline pseudo-square)
    x.fillStyle = '#0e1626'
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + s * 0.14, cy); x.lineTo(cx, cy + s * 0.14); x.closePath(); x.fill()
    x.beginPath(); x.moveTo(cx + s, cy + s); x.lineTo(cx + s - s * 0.14, cy + s); x.lineTo(cx + s, cy + s - s * 0.14); x.closePath(); x.fill()
    // two vertical busbars
    x.strokeStyle = 'rgba(150,170,200,0.16)'; x.lineWidth = 1
    x.beginPath(); x.moveTo(cx + s * 0.34, cy); x.lineTo(cx + s * 0.34, cy + s)
    x.moveTo(cx + s * 0.67, cy); x.lineTo(cx + s * 0.67, cy + s); x.stroke()
  }
  return toTex(c)
}

/* standing-seam metal roof — near-white pan with a raised seam line; tiled along
   the ridge so a bare gable reads as real seamed sheet metal (tint via material). */
function roofseam() {
  const W = 64, H = 64
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#ededee'; x.fillRect(0, 0, W, H)
  x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, 2, H)     // seam shadow
  x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(2, 0, 1, H) // seam highlight
  const bc = canvasOf(W, H), b = bc.getContext('2d')
  b.fillStyle = '#7c7c7c'; b.fillRect(0, 0, W, H)
  b.fillStyle = '#ffffff'; b.fillRect(0, 0, 3, H)               // raised standing seam
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* wood / composite deck boards — near-white plank map (tint reads true) running
   along one axis, with board gaps + faint grain. Used with a warm deck colour. */
function deck() {
  const W = 256, H = 256, boards = 8, bw = H / boards
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#f0eee9'; x.fillRect(0, 0, W, H)
  for (let i = 0; i < boards; i++) {
    const base = 233 + Math.random() * 14
    x.fillStyle = `rgb(${base | 0},${(base - 2) | 0},${(base - 5) | 0})`
    x.fillRect(0, i * bw, W, bw)
    for (let s = 0; s < 12; s++) { x.strokeStyle = `rgba(70,48,28,${Math.random() * 0.05})`; x.lineWidth = 0.8; const yy = i * bw + Math.random() * bw; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke() }
    // subtle anti-slip groove pair on composite boards
    x.strokeStyle = 'rgba(40,28,18,0.05)'; x.lineWidth = 1
    x.beginPath(); x.moveTo(0, i * bw + bw * 0.4); x.lineTo(W, i * bw + bw * 0.4); x.moveTo(0, i * bw + bw * 0.6); x.lineTo(W, i * bw + bw * 0.6); x.stroke()
  }
  for (let i = 0; i <= boards; i++) { x.fillStyle = 'rgba(35,24,15,0.22)'; x.fillRect(0, i * bw - 1, W, 2) }

  const bc = canvasOf(W, H), b = bc.getContext('2d')
  b.fillStyle = '#8f8f8f'; b.fillRect(0, 0, W, H)
  for (let i = 0; i <= boards; i++) { b.fillStyle = '#181818'; b.fillRect(0, i * bw - 1.5, W, 3) }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* ground: a real lawn as ONE unique 2048² image mapped 1:1 onto the finite scenery
   square (NO tiling → no repeating "pattern × 50"). Built in scales so every area
   looks different yet blends: large soft regions of different green → medium
   mowing/wear patches → soft low-contrast blade grain (kept gentle so it never
   shimmers). Material colour stays white so these greens read true. */
function grass() {
  const S = 2048, cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#5c8a3e'; x.fillRect(0, 0, S, S)
  const blob = (cxp, cyp, r, col, a) => { const g = x.createRadialGradient(cxp, cyp, 0, cxp, cyp, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.arc(cxp, cyp, r, 0, 7); x.fill() }
  // LARGE regions — the dominant low-frequency variation (each part of the lawn a
  // slightly different, natural green/olive); makes it read as one cohesive field
  const greens = ['#6a9844', '#52792d', '#769f4d', '#496d27', '#82a955', '#5d8636', '#8faa4d', '#5a8537', '#6e9c46', '#7f9a48']
  for (let i = 0; i < 95; i++) blob(Math.random() * S, Math.random() * S, 220 + Math.random() * 640, greens[(Math.random() * greens.length) | 0], 0.10 + Math.random() * 0.13)
  // MEDIUM patches — mowing sweeps + wear
  for (let i = 0; i < 480; i++) blob(Math.random() * S, Math.random() * S, 55 + Math.random() * 200, Math.random() < 0.5 ? '#8db257' : '#496e2c', 0.05 + Math.random() * 0.08)
  // sun-dried / bare patches (warmer, slightly more of them for realism)
  for (let i = 0; i < 80; i++) blob(Math.random() * S, Math.random() * S, 35 + Math.random() * 140, Math.random() < 0.6 ? '#a39a55' : '#8a7d46', 0.05 + Math.random() * 0.07)
  x.globalAlpha = 1
  // FINE blade grain — soft + low-contrast on purpose, so it adds richness up close
  // but mip-maps away cleanly at distance (no shimmer)
  for (let i = 0; i < 90000; i++) {
    const v = Math.random()
    x.strokeStyle = v > 0.45
      ? `rgba(${(112 + v * 64) | 0},${(152 + v * 60) | 0},${(64 + v * 30) | 0},${0.04 + Math.random() * 0.09})`
      : `rgba(${(50 + v * 40) | 0},${(82 + v * 44) | 0},${(34 + v * 22) | 0},${0.04 + Math.random() * 0.08})`
    x.lineWidth = 1
    const px = Math.random() * S, py = Math.random() * S
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 1.5 - Math.random() * 4); x.stroke()
  }
  // gentle bump (used at a low bumpScale on the plate) — soft so it never flickers
  const bc = canvasOf(S, S), b = bc.getContext('2d'); b.fillStyle = '#808080'; b.fillRect(0, 0, S, S)
  for (let i = 0; i < 90000; i++) { const v = (Math.random() * 255) | 0; b.fillStyle = `rgba(${v},${v},${v},0.3)`; const px = Math.random() * S, py = Math.random() * S; b.fillRect(px, py, 1, 1 + Math.random() * 2) }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* ground: a real architectural-concrete plaza as ONE unique 2048² image mapped 1:1
   onto the square (NO tiling). A grid of large-format slabs, each with its own tone,
   cloudy cure-marks, edge weathering near the joints, hairline cracks and the odd
   stain — so it reads as a genuine poured/paved plaza, never a repeating texture. */
function groundConcrete() {
  const S = 2048, cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#b8b8b3'; x.fillRect(0, 0, S, S)
  const N = 15, cw = S / N
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x0 = i * cw, y0 = j * cw
    const t = 176 + (Math.random() * 34 - 17)          // unique per-slab base tone (cool grey)
    x.fillStyle = `rgb(${t | 0},${(t) | 0},${(t - 4) | 0})`
    x.fillRect(x0, y0, cw, cw)
    // cloudy cure / float marks
    for (let k = 0; k < 9; k++) {
      const cxp = x0 + Math.random() * cw, cyp = y0 + Math.random() * cw, r = cw * 0.14 + Math.random() * cw * 0.46
      const g = x.createRadialGradient(cxp, cyp, 0, cxp, cyp, r)
      g.addColorStop(0, Math.random() < 0.5 ? 'rgba(244,244,239,0.06)' : 'rgba(104,106,108,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      x.fillStyle = g; x.beginPath(); x.arc(cxp, cyp, r, 0, 7); x.fill()
    }
    // soft edge weathering (slabs darken slightly toward the joints)
    x.strokeStyle = 'rgba(74,74,70,0.05)'
    for (let e = 0; e < 4; e++) { x.lineWidth = cw * (0.16 - e * 0.035); x.strokeRect(x0 + cw * 0.04 + e * 2, y0 + cw * 0.04 + e * 2, cw * 0.92 - e * 4, cw * 0.92 - e * 4) }
    // hairline cracks on some slabs
    if (Math.random() < 0.35) {
      x.strokeStyle = 'rgba(58,58,55,0.22)'; x.lineWidth = 1
      let px = x0 + Math.random() * cw, py = y0 + Math.random() * cw
      x.beginPath(); x.moveTo(px, py)
      for (let s = 0; s < 6; s++) { px += (Math.random() - 0.5) * cw * 0.4; py += (Math.random() - 0.5) * cw * 0.4; x.lineTo(px, py) }
      x.stroke()
    }
    // the odd damp/dirt stain
    if (Math.random() < 0.16) {
      const cxp = x0 + Math.random() * cw, cyp = y0 + Math.random() * cw, r = cw * 0.18 + Math.random() * cw * 0.32
      const g = x.createRadialGradient(cxp, cyp, 0, cxp, cyp, r)
      g.addColorStop(0, 'rgba(86,80,68,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      x.fillStyle = g; x.beginPath(); x.arc(cxp, cyp, r, 0, 7); x.fill()
    }
  }
  // fine aggregate speckle across the whole field
  for (let i = 0; i < 80000; i++) { const d = (Math.random() * 255) | 0; x.fillStyle = `rgba(${d},${d},${d},0.028)`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  // recessed control joints (shadow groove + a thin sunlit lip)
  x.strokeStyle = 'rgba(34,34,32,0.5)'; x.lineWidth = 3
  for (let i = 0; i <= N; i++) { x.beginPath(); x.moveTo(i * cw, 0); x.lineTo(i * cw, S); x.moveTo(0, i * cw); x.lineTo(S, i * cw); x.stroke() }
  x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 1
  for (let i = 0; i <= N; i++) { x.beginPath(); x.moveTo(i * cw + 2.5, 0); x.lineTo(i * cw + 2.5, S); x.moveTo(0, i * cw + 2.5); x.lineTo(S, i * cw + 2.5); x.stroke() }
  // bump: deep joints + faint aggregate
  const bc = canvasOf(S, S), b = bc.getContext('2d'); b.fillStyle = '#8c8c8c'; b.fillRect(0, 0, S, S)
  for (let i = 0; i < 55000; i++) { const d = (Math.random() * 255) | 0; b.fillStyle = `rgba(${d},${d},${d},0.16)`; b.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  b.fillStyle = '#121212'; for (let i = 0; i <= N; i++) { b.fillRect(i * cw - 2, 0, 4, S); b.fillRect(0, i * cw - 2, S, 4) }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* glazing — clean, light, cool vertical gradient (reflections do the rest) */
function glass() {
  const S = 128, c = canvasOf(S, S), x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#e2eef6'); g.addColorStop(0.5, '#c8dbe8'); g.addColorStop(1, '#b0c8d8')
  x.fillStyle = g; x.fillRect(0, 0, S, S)
  return toTex(c)
}

/* showroom floor — mid-light, soft fall-off; gloss + reflections do the work */
function floor() {
  const S = 512, c = canvasOf(S, S), x = c.getContext('2d')
  const g = x.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S / 2)
  g.addColorStop(0, '#b9bcc2'); g.addColorStop(0.5, '#9a9da3'); g.addColorStop(0.85, '#696c72'); g.addColorStop(1, '#4a4d53')
  x.fillStyle = g; x.fillRect(0, 0, S, S)
  for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  return toTex(c)
}

/* hangar wall — mid grey, a little darker toward the top */
function wall() {
  const S = 256, c = canvasOf(S, S), x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#34373d'); g.addColorStop(0.45, '#54585f'); g.addColorStop(1, '#797d84')
  x.fillStyle = g; x.fillRect(0, 0, S, S)
  x.strokeStyle = 'rgba(0,0,0,0.08)'; x.lineWidth = 2
  for (let i = 0; i <= S; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke() }
  return toTex(c)
}

let _cache = null
export function getTextures() {
  if (_cache) return _cache
  _cache = {
    corrugated: corrugated(),
    wood: wood(),
    panel: panel(),
    render: render(),
    solar: solar(),
    deck: deck(),
    roofseam: roofseam(),
    glass: glass(),
    floor: floor(),
    wall: wall(),
  }
  return _cache
}

/* return the {map, bump} pair for a cladding kind */
export function claddingTex(kind) {
  const t = getTextures()
  return t[kind] || t.corrugated
}

/* clone + independently tile a texture for a given face size. Mipmaps +
   anisotropy are forced on the clone so tiled ribs/planks never alias or shimmer
   when the camera moves (the "miganie" the client reported on the walls). */
export function tiled(base, rx, ry) {
  const t = base.clone()
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 16
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}
