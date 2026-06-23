/* PRESENT MODE — heavy, photoreal visualisation built from the grid plan. */
import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useThree, invalidate } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import PresentModule from './PresentModule.jsx'
import { claddingTex, tiled, getTextures } from '../textures.js'
import {
  CELL, MODULE_H, FLOOR_H, FOUNDATION_H, buildBounds, claddingById, cellKey,
  roofRectangles, exposedTopCells, bayWorld, bayKey, solarKey,
  terraceKey, DOOR, WINDOW,
} from '../../data/builder.js'

/* ── Per-cladding JOINERY palettes ──────────────────────────────────────────
   FRAME / sill / handle / glass-tint are TAILORED to each wall so the joinery looks
   designed-for-that-cladding. frame/sill = anodised alu (some metalness), handle =
   metal hardware, glass = reflective IGU with a per-wall tint + a sky-reflection
   emissive map (the drei <Environment> is bright softboxes on black, so a head-on
   pane could reflect a BLACK direction → the emissive sky map keeps it from reading
   black). The DOOR LEAF is NOT here — it is built from the chosen cladding itself
   (same colour + wood texture) in openMats, so the door matches the container.
   Tuned for the bright studio + ACES. */
const CLAD_JOINERY = {
  // anthracite wall → brushed-alu frame LIFTED off the dark wall, steel handle
  graphite:    { frame: { hex: '#5b626b', rough: 0.42, metal: 0.55, env: 1.05 }, sill: { hex: '#5b626b', rough: 0.4, metal: 0.55 }, handle: { hex: '#c6cad0', rough: 0.3, metal: 0.9 }, glass: { hex: '#cfe0ec', emissive: '#9fbdd4', int: 0.5 } },
  // warm white wall → crisp deep-anthracite frame
  white:       { frame: { hex: '#34383d', rough: 0.4, metal: 0.5, env: 0.95 }, sill: { hex: '#34383d', rough: 0.36, metal: 0.5 }, handle: { hex: '#3b4046', rough: 0.32, metal: 0.7 }, glass: { hex: '#d2e2ed', emissive: '#a8c4d8', int: 0.5 } },
  // honey larch wall → dark-bronze alu frame (warm-cohesive), bronze handle
  wood:        { frame: { hex: '#473a2a', rough: 0.45, metal: 0.5, env: 0.9 }, sill: { hex: '#473a2a', rough: 0.42, metal: 0.5 }, handle: { hex: '#9c8358', rough: 0.35, metal: 0.8 }, glass: { hex: '#d2dde0', emissive: '#aebfc4', int: 0.46 } },
  // smoked walnut wall → light champagne/taupe frame (reads OFF the dark wall)
  'wood-dark': { frame: { hex: '#917f64', rough: 0.45, metal: 0.5, env: 0.95 }, sill: { hex: '#917f64', rough: 0.42, metal: 0.5 }, handle: { hex: '#9c8358', rough: 0.35, metal: 0.8 }, glass: { hex: '#d4dde2', emissive: '#b2c2c8', int: 0.46 } },
}

function useMats() {
  const mats = useMemo(() => {
    const tex = getTextures()
    const deckMap = tex.deck.map.clone(); deckMap.colorSpace = THREE.SRGBColorSpace; deckMap.needsUpdate = true
    const deckBump = tex.deck.bump.clone(); deckBump.needsUpdate = true
    const pvMap = tex.solar.map.clone(); pvMap.colorSpace = THREE.SRGBColorSpace; pvMap.needsUpdate = true
    const pvBump = tex.solar.bump.clone(); pvBump.needsUpdate = true
    // standing-seam map runs UP the slope; tile along the ridge (~0.6 m pans)
    const seamMap = tiled(tex.roofseam.map, 16, 1); seamMap.colorSpace = THREE.SRGBColorSpace
    const seamBump = tiled(tex.roofseam.bump, 16, 1)
    return ({
    // ISO corner castings — forged cast-steel, a touch darker & more metallic than trim
    cast: new THREE.MeshStandardMaterial({ color: '#3a3e44', roughness: 0.48, metalness: 0.8, envMapIntensity: 0.9 }),
    // frame rails / corner posts — mid-charcoal trim (reads as slim trim, NOT a black cage).
    // a polygon offset makes them win the depth test over the cladding box → no z-fight flicker
    frame: new THREE.MeshStandardMaterial({ color: '#4a4e54', roughness: 0.45, metalness: 0.5, envMapIntensity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    door: new THREE.MeshStandardMaterial({ color: '#41454b', roughness: 0.4, metalness: 0.35, envMapIntensity: 0.8 }),
    floorPan: new THREE.MeshStandardMaterial({ color: '#1f2226', roughness: 0.9, metalness: 0.2 }),
    interior: new THREE.MeshStandardMaterial({ color: '#3f444c', roughness: 0.95, metalness: 0.03 }),
    // flat-roof / parapet-top membrane (clean neutral TPO/PVC grey)
    roof: new THREE.MeshStandardMaterial({ color: '#54585e', roughness: 0.78, metalness: 0.12, envMapIntensity: 0.6 }),
    // pitched standing-seam metal sheet (gable) — darker crisp anthracite with seams
    roofPanel: new THREE.MeshStandardMaterial({ color: '#494e55', map: seamMap, bumpMap: seamBump, bumpScale: 0.05, roughness: 0.5, metalness: 0.45, envMapIntensity: 0.95 }),
    // parapet coping cap — lightest hardware tone, draws a clean line round the attyka
    coping: new THREE.MeshStandardMaterial({ color: '#6a6e74', roughness: 0.42, metalness: 0.55, envMapIntensity: 1.0 }),
    // concrete foundation plinth
    plinth: new THREE.MeshStandardMaterial({ color: '#4f5358', roughness: 0.96, metalness: 0.04 }),
    // monocrystalline PV module — baked alu-frame+cell map (white colour reads it
    // true). Dielectric glass: metalness 0 + clearcoat (NOT metalness, which was
    // killing the blue albedo toward black); bump carves the inter-cell grooves.
    solar: new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: pvMap, bumpMap: pvBump, bumpScale: 0.02, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 }),
    // mill-finish aluminium PV mounting rail
    pvFrame: new THREE.MeshStandardMaterial({ color: '#8a9098', roughness: 0.4, metalness: 0.75, envMapIntensity: 1.0 }),
    // wood / composite terrace decking — desaturated warm teak (#9a7350) that
    // coordinates with anthracite AND white AND both wood claddings (its own quieter
    // tone, not a clash). bumpScale lifted so the board gaps + anti-slip ridges read.
    deck: new THREE.MeshStandardMaterial({ color: '#9a7350', map: deckMap, bumpMap: deckBump, bumpScale: 0.05, roughness: 0.62, metalness: 0, envMapIntensity: 0.5 }),
    // darker rim/apron board so the deck reads as a finished raised platform
    deckFascia: new THREE.MeshStandardMaterial({ color: '#7e5d39', roughness: 0.66, metalness: 0, envMapIntensity: 0.4 }),
    // recessed dark sub-deck frame → the shadow reveal under the rim that sells "raised deck"
    deckFrame: new THREE.MeshStandardMaterial({ color: '#3c352c', roughness: 0.9, metalness: 0 }),
  })
  }, [])
  // free GPU memory on unmount (present → build) — glass is a shared singleton
  useEffect(() => () => {
    // dispose materials AND their cloned map/bumpMap textures (Material.dispose
    // does not free textures) — glass is a shared singleton, leave it
    for (const [k, m] of Object.entries(mats)) if (k !== 'glass' && m?.dispose) { m.map?.dispose?.(); m.bumpMap?.dispose?.(); m.dispose() }
  }, [mats])
  return mats
}

function useBodies(cladding) {
  return useMemo(() => {
    const clad = claddingById[cladding] || claddingById.graphite
    const k = clad.kind
    const make = (lengthM) => {
      const pair = claddingTex(k)
      // real corrugation pitch ≈ 0.28 m (canvas = 22 ribs ≈ 6.16 m / tile) → rx ≈ length/6.16;
      // wood boards ≈ 0.17 m tall (canvas = 7 boards over height·ry) → ry ≈ 2.2
      const rx = k === 'wood' ? Math.max(1, lengthM / 5.5) : lengthM / 6.16
      const ry = k === 'wood' ? 2.2 : 1
      const map = tiled(pair.map, rx, ry); map.colorSpace = THREE.SRGBColorSpace
      const bump = tiled(pair.bump, rx, ry)
      // PBR comes from the finish data (CLADDINGS[].pbr) — painted-steel sheen for
      // anthracite/white (satin, soft-sky env) vs matte dielectric for timber — so
      // each finish reads as its real material. Falls back to kind defaults.
      const pbr = clad.pbr || {}
      return new THREE.MeshStandardMaterial({
        map, bumpMap: bump,
        bumpScale: k === 'corrugated' ? 0.055 : k === 'panel' ? 0.04 : k === 'wood' ? 0.04 : 0.02,
        color: clad.color,
        roughness: pbr.roughness ?? (k === 'render' ? 0.92 : k === 'wood' ? 0.68 : 0.5),
        metalness: pbr.metalness ?? (k === 'corrugated' || k === 'panel' ? 0.38 : 0.04),
        envMapIntensity: pbr.env ?? (k === 'wood' || k === 'render' ? 0.45 : 0.85),
      })
    }
    return { m20: make(6.1), m40: make(12.2) }
  }, [cladding])
}

/* ---- building-level roof: only over EXPOSED columns (nothing roofed under a
   module above). flat / parapet / gable, per maximal roof rectangle. ---- */
function boundaryEdges(cellSet) {
  const dirs = [[1, 0, 'xp'], [-1, 0, 'xm'], [0, 1, 'zp'], [0, -1, 'zm']]
  const edges = []
  for (const k of cellSet) {
    const i = k.indexOf(','); const x = +k.slice(0, i), z = +k.slice(i + 1)
    for (const [dx, dz, side] of dirs) {
      if (!cellSet.has(cellKey(x + dx, z + dz))) edges.push({ x, z, side })
    }
  }
  return edges
}

/* shared gable pitch — RoofLayer (the slopes) and solarPlacement (panels on the
   pitch) MUST derive the rise from the same formula, or panels tilt off the roof */
const gableRise = (short) => Math.min(short * 0.42, 1.5)

function RoofLayer({ modules, type, mats, cladColor }) {
  const rects = useMemo(() => roofRectangles(modules), [modules])
  const byLevel = useMemo(() => exposedTopCells(modules), [modules])
  // cladding-matched material — gable-end walls + the parapet (attyka) upstand,
  // so a pitched/parapet roof always reads as part of the same building.
  const cladMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: cladColor || '#3f4348', roughness: 0.6, metalness: 0.18, envMapIntensity: 0.6, side: THREE.DoubleSide }),
    [cladColor]
  )
  useEffect(() => () => cladMat.dispose(), [cladMat])

  const PARAPET_H = 0.42        // attyka upstand height above the roof
  const EAVE = 0.28             // gable eaves overhang past the walls

  return (
    <group>
      {rects.map((r, i) => {
        if (type === 'gable') {
          const short = Math.min(r.sx, r.sz)
          const long = Math.max(r.sx, r.sz)
          const ridgeAlongX = r.sx >= r.sz
          const rise = gableRise(short)
          const ang = Math.atan2(rise, short / 2)
          const slant = Math.hypot(short / 2, rise)
          const eaveSlant = EAVE / Math.cos(ang)   // overhang measured along the pitch
          // triangular gable-end walls close the attic so it never reads as hollow
          const endShape = new THREE.Shape()
          endShape.moveTo(-short / 2, -0.04); endShape.lineTo(short / 2, -0.04); endShape.lineTo(0, rise); endShape.closePath()
          const panelLen = slant + eaveSlant   // sloped panel incl. eaves overhang
          const cz0 = short / 4                 // centre of each half-pitch in Z
          return (
            <group key={i} position={[r.cx, r.y, r.cz]} rotation={[0, ridgeAlongX ? 0 : Math.PI / 2, 0]}>
              {/* two metal slopes (anthracite standing-seam look), overhanging the eaves + gables */}
              <mesh position={[0, rise / 2, cz0]} rotation={[ang, 0, 0]} castShadow receiveShadow material={mats.roofPanel}><boxGeometry args={[long + 2 * EAVE, 0.08, panelLen]} /></mesh>
              <mesh position={[0, rise / 2, -cz0]} rotation={[-ang, 0, 0]} castShadow receiveShadow material={mats.roofPanel}><boxGeometry args={[long + 2 * EAVE, 0.08, panelLen]} /></mesh>
              {/* ridge cap */}
              <mesh position={[0, rise + 0.03, 0]} castShadow material={mats.coping}><boxGeometry args={[long + 2 * EAVE + 0.04, 0.1, 0.16]} /></mesh>
              {/* fascia boards along both eaves */}
              <mesh position={[0, -0.02, short / 2 + EAVE]} material={mats.coping}><boxGeometry args={[long + 2 * EAVE, 0.13, 0.04]} /></mesh>
              <mesh position={[0, -0.02, -(short / 2 + EAVE)]} material={mats.coping}><boxGeometry args={[long + 2 * EAVE, 0.13, 0.04]} /></mesh>
              {/* gable-end triangles in the cladding colour */}
              <mesh position={[long / 2 - 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={cladMat} castShadow receiveShadow><shapeGeometry args={[endShape]} /></mesh>
              <mesh position={[-(long / 2 - 0.02), 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={cladMat} castShadow receiveShadow><shapeGeometry args={[endShape]} /></mesh>
            </group>
          )
        }
        // flat + parapet share the membrane slab — lifted clear of the module top rail
        return <mesh key={i} position={[r.cx, r.y + 0.085, r.cz]} material={mats.roof} castShadow receiveShadow><boxGeometry args={[r.sx + 0.04, 0.09, r.sz + 0.04]} /></mesh>
      })}

      {/* parapet (attyka): a low cladding upstand + a bright metal coping cap, on the
          true roof outline (per storey) — reads as a real parapet, not a black band */}
      {type === 'parapet' && [...byLevel.entries()].flatMap(([level, cells]) => {
        const y = FOUNDATION_H + level * FLOOR_H + MODULE_H
        return boundaryEdges(cells).map((e, j) => {
          const horiz = e.side === 'zp' || e.side === 'zm'
          const px = (e.x + 0.5) * CELL + (e.side === 'xp' ? CELL / 2 : e.side === 'xm' ? -CELL / 2 : 0)
          const pz = (e.z + 0.5) * CELL + (e.side === 'zp' ? CELL / 2 : e.side === 'zm' ? -CELL / 2 : 0)
          const wall = horiz ? [CELL + 0.04, PARAPET_H, 0.1] : [0.1, PARAPET_H, CELL + 0.04]
          const cap = horiz ? [CELL + 0.12, 0.06, 0.16] : [0.16, 0.06, CELL + 0.12]
          return (
            <group key={level + '-' + j}>
              <mesh position={[px, y + PARAPET_H / 2, pz]} material={cladMat} castShadow receiveShadow><boxGeometry args={wall} /></mesh>
              <mesh position={[px, y + PARAPET_H + 0.01, pz]} material={mats.coping} castShadow><boxGeometry args={cap} /></mesh>
            </group>
          )
        })
      })}
    </group>
  )
}

/* ---- client-placed openings (true-to-size, on the exact bays) ----
   frameMat / doorMat are family-aware (see openingMaterials): white PVC frame on
   light/wood walls, anthracite on graphite; anthracite door leaf, or timber on wood. */
/* Visible opening sizes are CLAMPED to fit inside one CELL (1.22 m): glass 1.02 <
   frame 1.14 < sill 1.16 < CELL — ~0.03 m cladding reveal each side. So an opening
   on an edge/corner bay never pokes past the module. (The data WINDOW/DOOR sizes
   drive the build-mode grid; here we only constrain the present-mode render. The
   openings are surface-mounted PROUD of the wall — there is no boolean cut, so any
   geometry at local z<=0 would be hidden inside the solid cladding box.) */
const WIN_GLASS = 1.02, WIN_SILL = 1.16, FB = 0.06   // glass, sill, frame-bar thickness
const DOOR_LEAF = 0.98

/* A HOLLOW frame = four perimeter bars around an opening (NOT a solid slab, which
   would hide the glass behind it — the root cause of the "black panel" look).
   gw×gh is the clear glazed area; bars sit proud at z=zb. */
function FrameBorder({ mat, gw, gh, zb = 0.045, t = FB, depth = 0.05, bottom = true }) {
  return (
    <group>
      <mesh material={mat} position={[0, gh / 2 + t / 2, zb]}><boxGeometry args={[gw + 2 * t, t, depth]} /></mesh>
      {bottom && <mesh material={mat} position={[0, -gh / 2 - t / 2, zb]}><boxGeometry args={[gw + 2 * t, t, depth]} /></mesh>}
      <mesh material={mat} position={[-gw / 2 - t / 2, 0, zb]}><boxGeometry args={[t, gh, depth]} /></mesh>
      <mesh material={mat} position={[gw / 2 + t / 2, 0, zb]}><boxGeometry args={[t, gh, depth]} /></mesh>
    </group>
  )
}

function PDoor({ frameMat, sillMat, glassMat, doorMat, handleMat }) {
  const h = DOOR.h, cy = h / 2, dw = DOOR_LEAF, gh = h - 0.04
  const lightY = h * 0.2, lightH = h * 0.34, lightW = dw * 0.62      // glazed upper light
  const panelY = -h * 0.18, panelH = h * 0.34, panelW = dw * 0.66    // recessed lower panel
  return (
    <group position={[0, cy, 0]}>
      {/* hollow frame around the leaf (3-sided; threshold closes the bottom) */}
      <FrameBorder mat={frameMat} gw={dw} gh={gh} zb={0.05} bottom={false} />
      {/* solid door leaf, proud of the wall (surface-mounted) */}
      <mesh material={doorMat} position={[0, 0, 0.02]}><boxGeometry args={[dw, gh, 0.05]} /></mesh>
      {/* glazed upper light + its bead → reflective pane visible, framed */}
      <mesh material={glassMat} position={[0, lightY, 0.055]}><boxGeometry args={[lightW, lightH, 0.02]} /></mesh>
      <group position={[0, lightY, 0]}><FrameBorder mat={frameMat} gw={lightW} gh={lightH} zb={0.052} t={0.02} depth={0.024} /></group>
      {/* mid-rail dividing glazed top from solid bottom */}
      <mesh material={frameMat} position={[0, h * 0.02, 0.05]}><boxGeometry args={[dw, 0.045, 0.05]} /></mesh>
      {/* recessed panel moulding on the lower leaf (classic door detail) */}
      <group position={[0, panelY, 0]}><FrameBorder mat={frameMat} gw={panelW} gh={panelH} zb={0.047} t={0.016} depth={0.012} /></group>
      {/* lever handle + lock escutcheon on the latch side */}
      <group position={[dw * 0.34, 0, 0.07]}>
        <mesh material={handleMat}><boxGeometry args={[0.05, 0.2, 0.02]} /></mesh>
        <mesh material={handleMat} position={[-0.03, 0, 0.025]}><boxGeometry args={[0.11, 0.028, 0.03]} /></mesh>
      </group>
      {/* brushed kick plate at the foot of the leaf */}
      <mesh material={handleMat} position={[0, -gh / 2 + 0.11, 0.047]}><boxGeometry args={[dw - 0.05, 0.18, 0.008]} /></mesh>
      {/* three hinges on the hinge side */}
      {[0.34, 0, -0.34].map((yf, i) => (
        <mesh key={i} material={handleMat} position={[-dw / 2 - 0.005, gh * yf * 0.5, 0.045]}><boxGeometry args={[0.03, 0.1, 0.04]} /></mesh>
      ))}
      {/* threshold */}
      <mesh material={sillMat} position={[0, -h / 2 + 0.01, 0.045]}><boxGeometry args={[dw + 2 * FB, 0.045, 0.11]} /></mesh>
    </group>
  )
}
function PWindow({ frameMat, sillMat, glassMat }) {
  const h = WINDOW.h, cy = WINDOW.sill + h / 2
  const gw = WIN_GLASS, gh = h - 0.04, sw = WIN_SILL
  return (
    <group position={[0, cy, 0]}>
      {/* the reflective glass PANE — the front-most large surface; the reflective +
          emissive (sky-reflection map) glass is what keeps it from reading as black. */}
      <mesh material={glassMat} position={[0, 0, 0.03]}><boxGeometry args={[gw, gh, 0.02]} /></mesh>
      {/* main outer frame */}
      <FrameBorder mat={frameMat} gw={gw} gh={gh} zb={0.043} />
      {/* inner glazing bead — a thinner sash inside the frame (two-tier profile depth) */}
      <FrameBorder mat={frameMat} gw={gw - 0.05} gh={gh - 0.05} zb={0.052} t={0.016} depth={0.03} />
      {/* slim mullion + transom over the glass → four-pane division */}
      <mesh material={frameMat} position={[0, 0, 0.044]}><boxGeometry args={[0.03, gh, 0.046]} /></mesh>
      <mesh material={frameMat} position={[0, 0, 0.044]}><boxGeometry args={[gw, 0.03, 0.046]} /></mesh>
      {/* protruding powder-coated alu cill */}
      <mesh material={sillMat} position={[0, -gh / 2 - FB - 0.01, 0.05]}><boxGeometry args={[sw, 0.06, 0.13]} /></mesh>
      {/* slim drip cap / head flashing above */}
      <mesh material={sillMat} position={[0, gh / 2 + FB + 0.012, 0.05]}><boxGeometry args={[sw - 0.04, 0.026, 0.1]} /></mesh>
    </group>
  )
}
function OpeningsLayer({ openings, frameMat, sillMat, doorMat, handleMat, glassMat }) {
  return openings.map((o) => {
    const bw = bayWorld(o)
    return (
      <group key={bayKey(o)} position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]}>
        {o.type === 'door'
          ? <PDoor frameMat={frameMat} sillMat={sillMat} glassMat={glassMat} doorMat={doorMat} handleMat={handleMat} />
          : <PWindow frameMat={frameMat} sillMat={sillMat} glassMat={glassMat} />}
      </group>
    )
  })
}

/* Where a solar panel sits, given the roof type. On flat/parapet roofs it rests
   just above the slab with a slight tilt. On a GABLE roof it must lie ON the
   pitch — find the roof rectangle the cell belongs to, work out which slope it is
   on and how high up that slope, and tilt the panel to match the gable angle so
   it never clips into the roof. */
function solarPlacement(cell, rects, roofType) {
  const cx = (cell.x + 0.5) * CELL
  const cz = (cell.z + 0.5) * CELL
  const topY = FOUNDATION_H + cell.floor * FLOOR_H + MODULE_H
  // tilted array on racking (classic flat-roof PV): each module pitched ~16° south,
  // raised so the low edge clears the membrane slab (slab top ≈ topY+0.13)
  const flat = { pos: [cx, topY + 0.3, cz], rot: [-0.28, 0, 0], base: topY + 0.13 }
  if (roofType !== 'gable') return flat

  const r = rects.find((rr) => Math.abs(rr.y - topY) < 0.02
    && Math.abs(cx - rr.cx) <= rr.sx / 2 + 1e-3 && Math.abs(cz - rr.cz) <= rr.sz / 2 + 1e-3)
  if (!r) return flat

  const ridgeAlongX = r.sx >= r.sz          // ridge runs along the longer axis
  const short = Math.min(r.sx, r.sz)
  const rise = gableRise(short)
  const ang = Math.atan2(rise, short / 2)
  const off = ridgeAlongX ? cz - r.cz : cx - r.cx   // signed distance from the ridge
  const side = off >= 0 ? 1 : -1
  const d = Math.min(Math.abs(off), short / 2)
  const y = r.y + 0.04 + rise * (1 - d / (short / 2)) + 0.10 / Math.cos(ang)
  // tilt the panel to lie along the slope (about the ridge axis)
  const rot = ridgeAlongX ? [side * ang, 0, 0] : [0, 0, -side * ang]
  return { pos: [cx, y, cz], rot }
}

/* ---- client-placed solar panels (follow the roof: flat or on the gable pitch) ---- */
function SolarLayer({ solar, modules, roofType, mats }) {
  const rects = useMemo(() => roofRectangles(modules), [modules])
  return solar.map((c) => {
    const t = solarPlacement(c, rects, roofType)
    return (
      <group key={solarKey(c)}>
        {/* low racking pedestal on the membrane (flat roofs only) */}
        {t.base != null && (
          <mesh material={mats.pvFrame} position={[t.pos[0], (t.base + t.pos[1] - 0.04) / 2, t.pos[2]]}>
            <boxGeometry args={[CELL * 0.6, t.pos[1] - 0.04 - t.base, 0.06]} />
          </mesh>
        )}
        <group position={t.pos} rotation={t.rot}>
          {/* thin module: dark cell glass (baked map) on a slim alu tray */}
          <mesh material={mats.solar} castShadow><boxGeometry args={[CELL * 0.99, 0.04, CELL * 0.99]} /></mesh>
          <mesh material={mats.pvFrame} position={[0, -0.028, 0]}><boxGeometry args={[CELL, 0.025, CELL]} /></mesh>
        </group>
      </group>
    )
  })
}

/* ---- client-placed terrace deck (on the exact ground cells) ----
   Each tile = a proud top board layer + a recessed dark sub-frame (the shadow reveal
   that reads as a raised deck) + perimeter fascia boards on the OUTER edges only, so
   a multi-cell terrace reads as one finished platform, not floating slabs. */
function TerraceLayer({ terrace, mats }) {
  const set = useMemo(() => new Set(terrace.map((c) => `${c.x},${c.z}`)), [terrace])
  const yTop = FOUNDATION_H            // deck surface ~ container plinth level
  const FH = 0.13                       // fascia / skirt height
  return terrace.map((c) => {
    const cx = (c.x + 0.5) * CELL, cz = (c.z + 0.5) * CELL
    const edges = []
    if (!set.has(`${c.x + 1},${c.z}`)) edges.push([(c.x + 1) * CELL, cz, [0.03, FH, CELL]])
    if (!set.has(`${c.x - 1},${c.z}`)) edges.push([c.x * CELL, cz, [0.03, FH, CELL]])
    if (!set.has(`${c.x},${c.z + 1}`)) edges.push([cx, (c.z + 1) * CELL, [CELL, FH, 0.03]])
    if (!set.has(`${c.x},${c.z - 1}`)) edges.push([cx, c.z * CELL, [CELL, FH, 0.03]])
    return (
      <group key={terraceKey(c)}>
        {/* proud top deck boards (a thin contact shadow grounds them) */}
        <mesh position={[cx, yTop - 0.025, cz]} material={mats.deck} receiveShadow castShadow><boxGeometry args={[CELL, 0.05, CELL]} /></mesh>
        {/* recessed dark sub-frame → shadow reveal under the deck rim */}
        <mesh position={[cx, yTop - 0.1, cz]} material={mats.deckFrame}><boxGeometry args={[CELL - 0.14, 0.09, CELL - 0.14]} /></mesh>
        {/* perimeter fascia boards (outer edges only) */}
        {edges.map(([ex, ez, size], i) => (
          <mesh key={i} position={[ex, yTop - 0.06, ez]} material={mats.deckFascia} castShadow receiveShadow><boxGeometry args={size} /></mesh>
        ))}
      </group>
    )
  })
}

function CaptureBridge({ captureRef }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!captureRef) return
    captureRef.current = () => { gl.render(scene, camera); return gl.domElement.toDataURL('image/png') }
    return () => { if (captureRef) captureRef.current = null }
  }, [gl, scene, camera, captureRef])
  return null
}

/* one-shot intro orbit, then idle (demand frameloop) */
function IntroSpin({ controls }) {
  useEffect(() => {
    // respect reduced-motion: skip the auto-orbit entirely
    if (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf, started = null
    const tick = (now) => {
      if (started === null) started = now
      const t = (now - started) / 1000
      if (controls.current && t < 3.2) {
        const e = 1 - t / 3.2
        controls.current.setAzimuthalAngle(controls.current.getAzimuthalAngle() - 0.006 * e)
        controls.current.update(); invalidate()
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [controls])
  return null
}

function PresentCamera({ controls, apiRef, bounds }) {
  const { camera } = useThree()
  const [cx, cz] = bounds.center
  const frame = useCallback((kind = 'iso') => {
    const c = controls.current
    if (!c) return
    const span = Math.max(bounds.size[0], bounds.size[1], 8)
    const dist = span * 1.5 + 12 + bounds.height
    const ty = bounds.height * 0.42
    c.target.set(cx, ty, cz)
    if (kind === 'top') camera.position.set(cx + 0.01, ty + dist * 1.2, cz)
    else if (kind === 'front') camera.position.set(cx, ty + bounds.height * 0.34, cz + dist)
    else camera.position.set(cx + dist * 0.82, ty + dist * 0.46, cz + dist * 0.72)
    camera.updateProjectionMatrix(); c.update(); invalidate()
  }, [bounds, camera, controls, cx, cz])

  useEffect(() => {
    if (apiRef) apiRef.current = { fit: () => frame('iso'), top: () => frame('top'), front: () => frame('front'), iso: () => frame('iso') }
    return () => { if (apiRef) apiRef.current = null }
  }, [apiRef, frame])

  const did = useRef(false)
  useEffect(() => { if (!did.current) { did.current = true; frame('iso') } }, [frame])
  return null
}

/* Clean STUDIO environment for every scene: white radial backdrop, white sweep
   floor, soft studio light, far fog (building always crisp), wide pull-back. The
   only customizable thing is the finite SCENERY square the building stands on. */
const STUDIO = {
  bg: { top: '#e7ebef', horizon: '#ffffff', radial: true },
  fogColor: '#f6f8fb',
  sun: { color: '#fff8f0', intensity: 2.5, pos: [-18, 40, 24] },
  fill: { color: '#eef3fb', intensity: 0.85 },
  hemi: { sky: '#ffffff', ground: '#e7eaee', intensity: 0.82 },
  ambient: 0.56, exposure: 1.09, envIntensity: 1.0,
  floor: { color: '#eef0f1', rough: 0.45, env: 0.9 },
  contact: '#1c2028',
}

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* gradient sky → a CanvasTexture used as scene.background (screen-space backdrop) */
function makeGradientSky(bg) {
  if (typeof document === 'undefined') return null
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S
  const x = c.getContext('2d')
  if (bg.flat) { x.fillStyle = bg.flat; x.fillRect(0, 0, S, S) }
  else if (bg.radial) {
    const g = x.createRadialGradient(S / 2, S * 0.58, 60, S / 2, S * 0.58, S * 0.78)
    g.addColorStop(0, bg.horizon); g.addColorStop(1, bg.top)
    x.fillStyle = g; x.fillRect(0, 0, S, S)
  } else {
    const g = x.createLinearGradient(0, 0, 0, S)
    g.addColorStop(0, bg.top); g.addColorStop(0.6, bg.horizon); g.addColorStop(1, bg.horizon)
    x.fillStyle = g; x.fillRect(0, 0, S, S)
    // faint stars across the upper sky (dusk)
    if (bg.stars) {
      for (let i = 0; i < 150; i++) {
        const sx = Math.random() * S, sy = Math.random() * S * 0.5
        x.fillStyle = `rgba(228,234,244,${0.22 + Math.random() * 0.55})`
        x.beginPath(); x.arc(sx, sy, Math.random() < 0.16 ? 1.6 : 0.85, 0, 7); x.fill()
      }
    }
    // the moon — a soft glow + a bright disc high in the sky (dusk)
    if (bg.moon) {
      const m = bg.moon, mx = m.x * S, my = m.y * S
      const gl = x.createRadialGradient(mx, my, 0, mx, my, m.glow)
      gl.addColorStop(0, hexA(m.color, 0.5)); gl.addColorStop(0.4, hexA(m.color, 0.12)); gl.addColorStop(1, hexA(m.color, 0))
      x.fillStyle = gl; x.fillRect(0, 0, S, S)
      x.fillStyle = m.color; x.beginPath(); x.arc(mx, my, m.r, 0, 7); x.fill()
      // faint mare shading on the disc
      x.fillStyle = hexA('#c9d2e2', 0.25); x.beginPath(); x.arc(mx - m.r * 0.25, my - m.r * 0.2, m.r * 0.28, 0, 7); x.fill()
      x.beginPath(); x.arc(mx + m.r * 0.3, my + m.r * 0.25, m.r * 0.2, 0, 7); x.fill()
    }
    if (bg.glow) {
      const rg = x.createRadialGradient(S * 0.68, S * 0.3, 6, S * 0.68, S * 0.3, S * 0.55)
      rg.addColorStop(0, hexA(bg.glow, 0.6)); rg.addColorStop(1, hexA(bg.glow, 0))
      x.fillStyle = rg; x.fillRect(0, 0, S, S)
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

/* imperatively own the present-mode background, fog + exposure for a scenery.
   Fog distances are scaled to the framing so distant ground fades into the sky
   at a visible horizon (near is past the building, so the building stays crisp). */
function SceneEnvironment({ env, fogNear, fogFar }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const tex = makeGradientSky(env.bg)
    if (tex) scene.background = tex
    scene.fog = env.fogColor ? new THREE.Fog(env.fogColor, fogNear, fogFar) : null
    const prev = gl.toneMappingExposure
    gl.toneMappingExposure = env.exposure
    invalidate()
    return () => { if (tex) tex.dispose(); scene.fog = null; gl.toneMappingExposure = prev }
  }, [gl, scene, env, fogNear, fogFar])
  return null
}

/* the big sweep floor — its colour comes from the BACKGROUND (white studio / light
   ground under sky / dark ground at dusk). Fog dissolves its rim into the backdrop. */
function SweepFloor({ color, rough, env, cx, cz, groundR }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: env }), [color, rough, env])
  useEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow material={mat}>
      <planeGeometry args={[groundR * 2, groundR * 2]} />
    </mesh>
  )
}

export default function PresentScene({ modules, openings = [], solar = [], terrace = [], finish, captureRef, cameraApiRef }) {
  const controls = useRef()
  const mats = useMats()
  const bodies = useBodies(finish?.cladding)
  const bounds = useMemo(() => buildBounds(modules), [modules])

  // joinery materials TAILORED to the current cladding (see CLAD_JOINERY): frame +
  // cill anodised alu, door leaf matte timber, handle metal hardware, and a per-wall
  // tinted reflective glass (emissive sky-reflection map → never a black panel).
  const openMats = useMemo(() => {
    const J = CLAD_JOINERY[finish?.cladding] || CLAD_JOINERY.graphite
    const frameMat = new THREE.MeshStandardMaterial({ color: J.frame.hex, roughness: J.frame.rough, metalness: J.frame.metal, envMapIntensity: J.frame.env })
    const sillMat = new THREE.MeshStandardMaterial({ color: J.sill.hex, roughness: J.sill.rough, metalness: J.sill.metal, envMapIntensity: 1.0 })
    // door leaf MATCHES the chosen container cladding: same colour, + the wood plank
    // texture on timber claddings (wood building → wood door; black → black door).
    // The contrasting frame + glazed light + hardware still read it AS a door.
    const clad = claddingById[finish?.cladding] || claddingById.graphite
    const pbr = clad.pbr || {}
    let doorMat
    if (clad.kind === 'wood') {
      const pair = claddingTex('wood')
      const dMap = tiled(pair.map, 1, 3); dMap.colorSpace = THREE.SRGBColorSpace
      const dBump = tiled(pair.bump, 1, 3)
      doorMat = new THREE.MeshStandardMaterial({ color: clad.color, map: dMap, bumpMap: dBump, bumpScale: 0.04, roughness: pbr.roughness ?? 0.68, metalness: pbr.metalness ?? 0.05, envMapIntensity: pbr.env ?? 0.45 })
    } else {
      doorMat = new THREE.MeshStandardMaterial({ color: clad.color, roughness: pbr.roughness ?? 0.5, metalness: pbr.metalness ?? 0.36, envMapIntensity: pbr.env ?? 0.8 })
    }
    const handleMat = new THREE.MeshStandardMaterial({ color: J.handle.hex, roughness: J.handle.rough, metalness: J.handle.metal, envMapIntensity: 1.1 })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: J.glass.hex, metalness: 0, roughness: 0.05,
      transmission: 0.07, thickness: 0.35, ior: 1.5, transparent: true,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.6, reflectivity: 0.82,
      emissive: new THREE.Color(J.glass.emissive), emissiveIntensity: J.glass.int, emissiveMap: getTextures().glassReflect,
    })
    return { frameMat, sillMat, doorMat, handleMat, glassMat }
  }, [finish?.cladding])

  // dispose cladding bodies AND their cloned map/bumpMap textures (Material.dispose
   // does not free its textures) when the cladding changes / on unmount
  useEffect(() => () => {
    for (const m of [bodies.m20, bodies.m40]) {
      m?.map?.dispose(); m?.bumpMap?.dispose(); m?.dispose()
    }
  }, [bodies])
  useEffect(() => () => {
    // emissiveMap is the shared getTextures().glassReflect — do NOT dispose it;
    // doorMat's wood map/bumpMap ARE cloned (tiled) → dispose them
    openMats.frameMat.dispose(); openMats.sillMat.dispose()
    openMats.doorMat.map?.dispose(); openMats.doorMat.bumpMap?.dispose(); openMats.doorMat.dispose()
    openMats.handleMat.dispose(); openMats.glassMat.dispose()
  }, [openMats])

  const env = STUDIO

  const [cx, cz] = bounds.center
  const span = Math.max(bounds.size[0], bounds.size[1], 8)
  const camDist = span * 1.5 + 12 + bounds.height
  // far fog → the building stays crisp at every zoom on the white backdrop
  const fogNear = camDist * 3
  const fogFar = camDist * 12
  // white sweep-floor radius: past the fog rim (so its edge dissolves into white) but
  // kept under the camera far plane (1200) so depth precision stays high → no flicker
  const groundR = Math.min(Math.max(fogFar * 1.3, 400), 1050)
  const maxCamDist = Math.max(60, Math.max(bounds.size[0], bounds.size[1]) * 3) * 1.4
  // the soft grey grounding "square" size
  const squareSize = Math.max(60, Math.max(bounds.size[0], bounds.size[1]) * 3)
  // halve the shadow map on phones — a 2048² map is a real cost on weak GPUs
  const shadowMap = (typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(max-width: 760px)').matches) ? 1024 : 2048

  return (
    <group>
      <SceneEnvironment env={env} fogNear={fogNear} fogFar={fogFar} />

      <hemisphereLight args={[env.hemi.sky, env.hemi.ground, env.hemi.intensity]} />
      <directionalLight
        position={[cx + env.sun.pos[0], env.sun.pos[1], cz + env.sun.pos[2]]}
        intensity={env.sun.intensity} color={env.sun.color} castShadow
        shadow-mapSize-width={shadowMap} shadow-mapSize-height={shadowMap}
        shadow-camera-near={1} shadow-camera-far={200}
        shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={65} shadow-camera-bottom={-65}
        shadow-bias={-0.0004} shadow-normalBias={0.02}
      />
      <directionalLight position={[cx - 18, 14, cz + 22]} intensity={env.fill.intensity} color={env.fill.color} />
      <ambientLight intensity={env.ambient} />

      {/* white studio sweep floor */}
      <SweepFloor color={env.floor.color} rough={env.floor.rough} env={env.floor.env} cx={cx} cz={cz} groundR={groundR} />

      {/* bare container bodies */}
      {modules.map((m) => <PresentModule key={m.id} mod={m} mats={mats} body={bodies[m.type]} />)}

      {/* building-level roof — only over exposed columns (never under a stacked module) */}
      <RoofLayer modules={modules} type={finish?.roof || 'flat'} mats={mats} cladColor={claddingById[finish?.cladding]?.color} />

      {/* client-placed add-ons, rendered exactly where they were designed */}
      <OpeningsLayer openings={openings} {...openMats} />
      <SolarLayer solar={solar} modules={modules} roofType={finish?.roof || 'flat'} mats={mats} />
      <TerraceLayer terrace={terrace} mats={mats} />

      {/* the soft grey grounding "square" on white — the studio look */}
      <ContactShadows position={[cx, FOUNDATION_H * 0.5, cz]} scale={squareSize} blur={2.6} far={14} opacity={0.46} resolution={1024} color={env.contact} />

      <Environment resolution={256} environmentIntensity={env.envIntensity}>
        {[[-30, -18], [0, -18], [30, -18], [-30, 18], [30, 18]].map(([x, z], i) => (
          <Lightformer key={i} intensity={1.4} form="rect" position={[x, 30, z]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 10, 1]} color={env.sun.color} />
        ))}
        <Lightformer intensity={0.7} form="rect" position={[0, 12, 50]} scale={[40, 20, 1]} color={env.bg.horizon || '#dfeaf6'} />
      </Environment>

      <PresentCamera controls={controls} apiRef={cameraApiRef} bounds={bounds} />
      <IntroSpin controls={controls} />
      <CaptureBridge captureRef={captureRef} />

      <OrbitControls
        ref={controls} makeDefault enablePan enableDamping dampingFactor={0.1}
        minDistance={6} maxDistance={maxCamDist}
        minPolarAngle={Math.PI * 0.08} maxPolarAngle={Math.PI * 0.47}
        target={[cx, bounds.height * 0.42, cz]} zoomToCursor
        onChange={() => {
          const c = controls.current
          if (c) {
            // never look below the ground (keeps the camera above the floor)
            if (c.target.y < 0) c.target.y = 0
            // keep the view anchored near the building (no flying off → no edge reveal)
            const lim = span * 1.5 + 24
            c.target.x = Math.min(Math.max(c.target.x, cx - lim), cx + lim)
            c.target.z = Math.min(Math.max(c.target.z, cz - lim), cz + lim)
          }
          invalidate()
        }}
      />
    </group>
  )
}
