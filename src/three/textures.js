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
  t.needsUpdate = true
  return t
}

/* trapezoidal / corrugated steel: flat colour + sinusoidal rib bump */
function corrugated() {
  const W = 512, H = 192, ribs = 24, rw = W / ribs
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#bcbcbc'; x.fillRect(0, 0, W, H)
  for (let i = 0; i < 1100; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.022})`; x.fillRect(Math.random() * W, Math.random() * H, 2, 1) }
  // a couple of faint horizontal seams (panel joints)
  x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, H * 0.5 - 1, W, 2)

  const bc = canvasOf(W, H), b = bc.getContext('2d')
  for (let px = 0; px < W; px++) {
    const ph = (px / rw) * Math.PI * 2
    // rounded-trapezoid profile via clamped sine
    const v = Math.round(128 + 112 * Math.max(-1, Math.min(1, Math.sin(ph) * 1.25)))
    b.fillStyle = `rgb(${v},${v},${v})`; b.fillRect(px, 0, 1, H)
  }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* horizontal timber planks: grain colour + gap/grain bump */
function wood() {
  const W = 256, H = 512, planks = 9, ph = H / planks
  const cc = canvasOf(W, H), x = cc.getContext('2d')
  x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, W, H)
  for (let i = 0; i < planks; i++) {
    const base = 150 + Math.random() * 24
    x.fillStyle = `rgb(${base | 0},${(base - 4) | 0},${(base - 9) | 0})`
    x.fillRect(0, i * ph, W, ph)
    for (let s = 0; s < 42; s++) {
      x.strokeStyle = `rgba(0,0,0,${Math.random() * 0.085})`
      x.lineWidth = Math.random() * 1.1
      const yy = i * ph + Math.random() * ph
      x.beginPath(); x.moveTo(0, yy)
      x.bezierCurveTo(80, yy + (Math.random() - 0.5) * 6, 170, yy + (Math.random() - 0.5) * 6, W, yy)
      x.stroke()
    }
  }
  const bc = canvasOf(W, H), b = bc.getContext('2d')
  b.fillStyle = '#9a9a9a'; b.fillRect(0, 0, W, H)
  for (let i = 0; i <= planks; i++) { b.fillStyle = '#1d1d1d'; b.fillRect(0, i * ph - 1.5, W, 3) }
  for (let s = 0; s < 240; s++) { b.strokeStyle = `rgba(255,255,255,${Math.random() * 0.18})`; b.lineWidth = 0.6; const yy = Math.random() * H; b.beginPath(); b.moveTo(0, yy); b.lineTo(W, yy); b.stroke() }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* flat composite panels: clean colour + seam bump */
function panel() {
  const S = 256
  const cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#c0c0c0'; x.fillRect(0, 0, S, S)
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.018})`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  const bc = canvasOf(S, S), b = bc.getContext('2d')
  b.fillStyle = '#9a9a9a'; b.fillRect(0, 0, S, S)
  b.strokeStyle = '#1a1a1a'; b.lineWidth = 4
  for (let i = 0; i <= S; i += 128) { b.beginPath(); b.moveTo(i, 0); b.lineTo(i, S); b.stroke() }
  for (let i = 0; i <= S; i += 85) { b.beginPath(); b.moveTo(0, i); b.lineTo(S, i); b.stroke() }
  return { map: toTex(cc), bump: toTex(bc, false) }
}

/* fine render / stucco */
function render() {
  const S = 128
  const cc = canvasOf(S, S), x = cc.getContext('2d')
  x.fillStyle = '#cacaca'; x.fillRect(0, 0, S, S)
  for (let i = 0; i < 7000; i++) { const d = Math.random() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${d},${d},${d},${Math.random() * 0.04})`; x.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
  const bc = canvasOf(S, S), b = bc.getContext('2d')
  b.fillStyle = '#888'; b.fillRect(0, 0, S, S)
  for (let i = 0; i < 5200; i++) { const d = (Math.random() * 255) | 0; b.fillStyle = `rgba(${d},${d},${d},0.45)`; b.fillRect(Math.random() * S, Math.random() * S, 1, 1) }
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

/* clone + independently tile a texture for a given face size */
export function tiled(base, rx, ry) {
  const t = base.clone()
  t.needsUpdate = true
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  return t
}
