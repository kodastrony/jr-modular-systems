import { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { useThree, invalidate } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'
import DotGrid from './DotGrid.jsx'
import * as B from '../../data/builder.js'

const { CELL, MODULE_H, FLOOR_H, FOUNDATION_H, PLOT_CELLS } = B
const PLOT_M = PLOT_CELLS * CELL
const C_VALID = new THREE.Color('#37d27a')
const C_WARN = new THREE.Color('#f3a431')
const C_INVALID = new THREE.Color('#ff4d4f')
const CLICK_PX = 9, CLICK_MS = 800
const floorY = (f) => FOUNDATION_H + f * FLOOR_H

const CONTAINER = new Set(['m20', 'm40'])
const OPENING = new Set(['door', 'window'])
const toolCat = (t) => CONTAINER.has(t) ? 'container' : OPENING.has(t) ? 'opening' : t === 'solar' ? 'solar' : t === 'terrace' ? 'terrace' : 'pick'

function useUnitBox() { return useMemo(() => new THREE.BoxGeometry(1, 1, 1), []) }

/* ── placed container ─────────────────────────────────────────── */
function BuildModule({ mod, geo, color, dim, selected, hover, eraseMode }) {
  const [sx, sz] = B.footprintMetres(mod)
  const pos = B.worldPosition(mod)
  const mat = useMemo(() => {
    const base = new THREE.Color(color); if (dim) base.multiplyScalar(0.72)
    return new THREE.MeshLambertMaterial({ color: base, transparent: dim, opacity: dim ? 0.46 : 1, polygonOffset: true, polygonOffsetFactor: 1 })
  }, [color, dim])
  useEffect(() => () => mat.dispose(), [mat])
  const hot = hover ? (eraseMode ? '#ff4d4f' : '#ff7a3d') : null
  const edgeColor = selected ? '#f0581f' : hot || (dim ? '#5a6172' : '#11151c')
  return (
    <group position={[pos[0], pos[1], pos[2]]} userData={{ kind: 'module', id: mod.id }}>
      <mesh geometry={geo} material={mat} scale={[sx, MODULE_H, sz]} userData={{ kind: 'module', id: mod.id }}>
        <Edges threshold={15} scale={1} color={edgeColor} renderOrder={2} raycast={() => null} />
      </mesh>
      {hover && (
        <mesh geometry={geo} scale={[sx + 0.07, MODULE_H + 0.07, sz + 0.07]} raycast={() => null} renderOrder={5}>
          <meshBasicMaterial color={hot} transparent opacity={eraseMode ? 0.16 : 0.1} depthWrite={false} />
          <Edges threshold={15} color={hot} renderOrder={6} raycast={() => null} />
        </mesh>
      )}
    </group>
  )
}

/* ── placed door / window (true-to-size plate on a bay) ───────────── */
function OpeningPlate({ o, geo, hot }) {
  const bw = B.bayWorld(o)
  const isDoor = o.type === 'door'
  const dimO = isDoor ? B.DOOR : B.WINDOW
  const cy = isDoor ? dimO.h / 2 : dimO.sill + dimO.h / 2
  const key = B.bayKey(o)
  return (
    <group position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]} userData={{ kind: 'opening', key }}>
      <mesh geometry={geo} position={[0, cy, 0.05]} scale={[dimO.w, dimO.h, 0.09]} userData={{ kind: 'opening', key }}>
        <meshLambertMaterial color={isDoor ? '#2b2f35' : '#86b0cc'} />
        <Edges threshold={15} color={hot ? '#ff4d4f' : '#0c0f13'} raycast={() => null} />
      </mesh>
    </group>
  )
}

/* ── placed solar panel ───────────────────────────────────────── */
function SolarTile({ c, geo, hot }) {
  const w = B.solarWorld(c)
  return (
    <mesh geometry={geo} position={[w.cx, w.y + 0.05, w.cz]} scale={[CELL * 0.94, 0.06, CELL * 0.94]} userData={{ kind: 'solar', key: B.solarKey(c) }}>
      <meshLambertMaterial color="#15315c" />
      <Edges threshold={15} color={hot ? '#ff4d4f' : '#4f7fc4'} raycast={() => null} />
    </mesh>
  )
}

/* ── placed terrace tile ──────────────────────────────────────── */
function TerraceTile({ c, geo, hot }) {
  const w = B.terraceWorld(c)
  return (
    <mesh geometry={geo} position={[w.cx, w.y / 2, w.cz]} scale={[CELL, w.y, CELL]} userData={{ kind: 'terrace', key: B.terraceKey(c) }}>
      <meshLambertMaterial color="#9c7a52" />
      <Edges threshold={15} color={hot ? '#ff4d4f' : '#6e5638'} raycast={() => null} />
    </mesh>
  )
}

/* ── grid of pickable targets on exterior walls (door/window tool) ── */
function BayGrid({ bays, openings }) {
  const occSet = useMemo(() => new Set(openings.map(B.bayKey)), [openings])
  return bays.map((b, i) => {
    const bw = B.bayWorld(b)
    const occ = occSet.has(B.bayKey(b))
    const col = occ ? '#ff9a4d' : '#37d27a'
    return (
      <group key={i} position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]} userData={{ kind: 'bayTarget', bay: b }}>
        <mesh position={[0, MODULE_H / 2, 0.03]} userData={{ kind: 'bayTarget', bay: b }}>
          <planeGeometry args={[CELL * 0.9, MODULE_H * 0.86]} />
          <meshBasicMaterial color={col} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    )
  })
}

/* ── grid of pickable targets on the roof (solar tool) ──────────── */
function RoofGrid({ cells, solar }) {
  const occSet = useMemo(() => new Set(solar.map(B.solarKey)), [solar])
  return cells.map((c, i) => {
    const w = B.solarWorld(c)
    const col = occSet.has(B.solarKey(c)) ? '#ff9a4d' : '#37d27a'
    return (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[w.cx, w.y + 0.03, w.cz]} userData={{ kind: 'roofTarget', cell: c }}>
        <planeGeometry args={[CELL * 0.9, CELL * 0.9]} />
        <meshBasicMaterial color={col} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    )
  })
}

/* ── camera framing + imperative API ──────────────────────────── */
function BuildCamera({ controlsRef, apiRef, modules }) {
  const { camera } = useThree()
  const bounds = useMemo(() => B.buildBounds(modules), [modules])
  const frame = useCallback((topDown = false) => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    const [cx, cz] = bounds.center
    const span = Math.max(bounds.size[0], bounds.size[1], 6)
    const dist = span * (topDown ? 1.15 : 1.5) + 9 + bounds.height
    const ty = bounds.height * 0.42
    ctrl.target.set(cx, ty, cz)
    if (topDown) camera.position.set(cx + 0.001, ty + dist, cz)
    else camera.position.set(cx + dist * 0.62, ty + dist * 0.74, cz + dist * 0.62)
    camera.updateProjectionMatrix(); ctrl.update(); invalidate()
  }, [bounds, camera, controlsRef])
  useEffect(() => {
    if (apiRef) apiRef.current = { fit: () => frame(false), topView: () => frame(true) }
    return () => { if (apiRef) apiRef.current = null }
  }, [apiRef, frame])
  const did = useRef(false)
  useEffect(() => { if (!did.current) { did.current = true; frame(false) } }, [frame])
  return null
}

export default function BuildScene({
  modules, openings = [], solar = [], terrace = [], finish, activeFloor, tool, rot, selectedId, hover,
  onPlace, onSelectModule, onEraseModule, onPlaceOpening, onPlaceSolar, onPlaceTerrace, onEraseElement,
  onHover, onHint, cameraApiRef,
}) {
  const { gl, camera, raycaster } = useThree()
  const controlsRef = useRef()
  const ghostRef = useRef()
  const ghostMatRef = useRef()
  const modulesGroupRef = useRef()
  const openingsGroupRef = useRef()
  const solarGroupRef = useRef()
  const terraceGroupRef = useRef()
  const bayTargetsRef = useRef()
  const roofTargetsRef = useRef()
  const geo = useUnitBox()

  const cat = toolCat(tool)
  const cladColor = B.claddingById[finish?.cladding]?.color || '#3b3e44'
  const occ = useMemo(() => B.occupancyByFloor(modules), [modules])
  const bays = useMemo(() => (cat === 'opening' ? B.exteriorBays(modules) : []), [cat, modules])
  const roofCs = useMemo(() => (cat === 'solar' ? B.roofCells(modules) : []), [cat, modules])

  // ghost / preview state (throttled to cell changes — cheap)
  const [ghostBay, setGhostBay] = useState(null)        // opening tool: bay under cursor
  const [previewCells, setPreviewCells] = useState([])  // solar/terrace: hovered or dragged cells
  const [previewOk, setPreviewOk] = useState(true)

  const ghostDims = useMemo(() => {
    if (cat !== 'container') return null
    const { w, d } = B.footprintDims(tool, rot)
    return [w * CELL, d * CELL]
  }, [cat, tool, rot])

  const lastCell = useRef({ cx: NaN, cz: NaN })
  const candidate = useRef(null)
  const hovered = useRef(null)
  const lastBayKey = useRef(null)
  const lastPrevKey = useRef(null)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  const stateRef = useRef({})
  stateRef.current = { cat, tool, rot, activeFloor, modules, openings, solar, terrace, occ }
  const cbRef = useRef({})
  cbRef.current = { onPlace, onSelectModule, onEraseModule, onPlaceOpening, onPlaceSolar, onPlaceTerrace, onEraseElement, onHover, onHint }

  // ── pointer controller (one, manual, fresh matrices) ──────────────
  useEffect(() => {
    const dom = gl.domElement
    const v3 = new THREE.Vector3()
    const ndc = (e) => {
      const r = dom.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }
    }
    const pick = (e, refs) => {
      const groups = refs.map((r) => r.current).filter(Boolean)
      if (!groups.length) return null
      groups.forEach((g) => g.updateMatrixWorld(true))
      raycaster.setFromCamera(ndc(e), camera)
      const objs = []
      groups.forEach((g) => objs.push(...g.children))
      const hits = raycaster.intersectObjects(objs, true)
      for (const h of hits) { let o = h.object; while (o && o.userData.kind === undefined) o = o.parent; if (o) return o.userData }
      return null
    }
    const pickCell = (e, y) => {
      plane.constant = -y
      raycaster.setFromCamera(ndc(e), camera)
      if (!raycaster.ray.intersectPlane(plane, v3)) return null
      return { x: Math.floor(v3.x / CELL), z: Math.floor(v3.z / CELL) }
    }

    const moveGhostContainer = (e) => {
      const s = stateRef.current
      if (!ghostRef.current) return
      // Auto storey: hovering a container's roof stacks on top of it; the open
      // ground places on the ground floor. No manual floor picking.
      let targetFloor = 0
      const roofHit = pick(e, [modulesGroupRef])
      if (roofHit && roofHit.kind === 'module') {
        const m = s.modules.find((x) => x.id === roofHit.id)
        if (m) targetFloor = m.floor + 1
      }
      if (targetFloor >= B.MAX_FLOORS) {
        ghostRef.current.visible = false
        candidate.current = null
        lastCell.current = { cx: NaN, cz: NaN, f: NaN }
        cbRef.current.onHint?.('full')
        invalidate()
        return
      }
      plane.constant = -floorY(targetFloor)
      raycaster.setFromCamera(ndc(e), camera)
      if (!raycaster.ray.intersectPlane(plane, v3)) return
      const { w, d } = B.footprintDims(s.tool, s.rot)
      const cx = Math.round(v3.x / CELL - w / 2), cz = Math.round(v3.z / CELL - d / 2)
      if (cx === lastCell.current.cx && cz === lastCell.current.cz && targetFloor === lastCell.current.f) return
      lastCell.current = { cx, cz, f: targetFloor }
      const cand = { type: s.tool, cx, cz, floor: targetFloor, rot: s.rot }
      const ok = B.validatePlacement(cand, s.modules, s.occ)
      const p = B.worldPosition(cand)
      ghostRef.current.position.set(p[0], floorY(targetFloor) + MODULE_H / 2, p[2])
      ghostRef.current.visible = true
      if (ghostMatRef.current) {
        ghostMatRef.current.color.copy(ok.ok ? (ok.warn ? C_WARN : C_VALID) : C_INVALID)
        ghostMatRef.current.opacity = ok.ok ? 0.5 : 0.36
      }
      candidate.current = ok.ok ? cand : null
      cbRef.current.onHint?.(ok.ok ? (ok.warn || null) : ok.reason)
      invalidate()
    }

    const setHover = (d) => {
      const key = d ? (d.id ?? d.key) : null
      if (key === hovered.current) return
      hovered.current = key
      cbRef.current.onHover?.(d)
      invalidate()
    }

    let down = null, dragging = false
    const dragSet = new Map()  // key → cell, while dragging solar/terrace

    const onDown = (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), button: e.button }
      const s = stateRef.current
      if (e.button !== 0) return
      // start a fill-drag only when pressing a valid target (so empty space still orbits)
      if (s.cat === 'solar') {
        const u = pick(e, [roofTargetsRef])
        if (u?.cell) { dragging = true; dragSet.clear(); dragSet.set(B.solarKey(u.cell), u.cell); controlsRef.current && (controlsRef.current.enabled = false); setPreviewCells([u.cell]); setPreviewOk(true); invalidate() }
      } else if (s.cat === 'terrace') {
        const c = pickCell(e, 0)
        if (c && B.isGroundFree(c.x, c.z, s.occ)) { dragging = true; dragSet.clear(); dragSet.set(B.terraceKey(c), c); controlsRef.current && (controlsRef.current.enabled = false); setPreviewCells([c]); setPreviewOk(true); invalidate() }
      }
    }

    const onMove = (e) => {
      const s = stateRef.current
      if (dragging) {
        if (s.cat === 'solar') {
          const u = pick(e, [roofTargetsRef])
          if (u?.cell) { const k = B.solarKey(u.cell); if (!dragSet.has(k)) { dragSet.set(k, u.cell); setPreviewCells([...dragSet.values()]); invalidate() } }
        } else if (s.cat === 'terrace') {
          const c = pickCell(e, 0)
          if (c && B.isGroundFree(c.x, c.z, s.occ)) { const k = B.terraceKey(c); if (!dragSet.has(k)) { dragSet.set(k, c); setPreviewCells([...dragSet.values()]); invalidate() } }
        }
        return
      }
      if (s.cat === 'container') { moveGhostContainer(e); return }
      if (s.cat === 'opening') {
        const u = pick(e, [bayTargetsRef])
        const bay = u?.bay || null
        const k = bay ? B.bayKey(bay) : null
        if (k !== lastBayKey.current) {
          lastBayKey.current = k
          setGhostBay(bay)
          setHover(bay ? { kind: 'opening', key: k } : null)
        }
        return
      }
      if (s.cat === 'solar') {
        const u = pick(e, [roofTargetsRef])
        const cell = u?.cell || null
        const k = cell ? B.solarKey(cell) : null
        if (k !== lastPrevKey.current) { lastPrevKey.current = k; setPreviewCells(cell ? [cell] : []); setPreviewOk(!!cell) }
        return
      }
      if (s.cat === 'terrace') {
        const c = pickCell(e, 0)
        const ok = c && B.isGroundFree(c.x, c.z, s.occ)
        const k = c ? B.terraceKey(c) : null
        if (k !== lastPrevKey.current) { lastPrevKey.current = k; setPreviewCells(c ? [c] : []); setPreviewOk(!!ok) }
        return
      }
      // select / erase → highlight whatever is under the cursor
      const u = pick(e, [modulesGroupRef, openingsGroupRef, solarGroupRef, terraceGroupRef])
      setHover(u ? { kind: u.kind, id: u.id, key: u.key } : null)
    }

    const finishDrag = (commit) => {
      const s = stateRef.current
      if (commit && dragSet.size) {
        const cells = [...dragSet.values()]
        if (s.cat === 'solar') cbRef.current.onPlaceSolar?.(cells)
        else if (s.cat === 'terrace') cbRef.current.onPlaceTerrace?.(cells)
      }
      dragging = false; dragSet.clear()
      if (controlsRef.current) controlsRef.current.enabled = true
      setPreviewCells([]); invalidate()
    }

    const onUp = (e) => {
      const d = down; down = null
      if (dragging) { finishDrag(true); return }
      if (!d) return
      const isClick = Math.hypot(e.clientX - d.x, e.clientY - d.y) < CLICK_PX && (performance.now() - d.t) < CLICK_MS
      if (!isClick) return
      const s = stateRef.current, cb = cbRef.current
      if (d.button === 2) {           // right click → erase anything
        const u = pick(e, [modulesGroupRef, openingsGroupRef, solarGroupRef, terraceGroupRef])
        if (u) cb.onEraseElement?.({ kind: u.kind, id: u.id, key: u.key })
        return
      }
      if (d.button !== 0) return
      if (s.cat === 'container') { if (candidate.current) cb.onPlace?.(candidate.current) }
      else if (s.cat === 'opening') { const u = pick(e, [bayTargetsRef]); if (u?.bay) cb.onPlaceOpening?.(u.bay, s.tool) }
      else if (s.cat === 'solar') { const u = pick(e, [roofTargetsRef]); if (u?.cell) cb.onPlaceSolar?.([u.cell]) }
      else if (s.cat === 'terrace') { const c = pickCell(e, 0); if (c && B.isGroundFree(c.x, c.z, s.occ)) cb.onPlaceTerrace?.([c]) }
      else {                          // select / erase
        const u = pick(e, [modulesGroupRef, openingsGroupRef, solarGroupRef, terraceGroupRef])
        if (s.tool === 'erase') { if (u) cb.onEraseElement?.({ kind: u.kind, id: u.id, key: u.key }) }
        else cb.onSelectModule?.(u && u.kind === 'module' ? u.id : null)
      }
    }

    const onLeave = () => {
      if (ghostRef.current) ghostRef.current.visible = false
      lastCell.current = { cx: NaN, cz: NaN }
      if (hovered.current != null) { hovered.current = null; cbRef.current.onHover?.(null) }
      if (dragging) finishDrag(false)
      setGhostBay(null); setPreviewCells([])
      cbRef.current.onHint?.(null); invalidate()
    }
    const onCtx = (e) => e.preventDefault()

    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointermove', onMove)
    dom.addEventListener('pointerup', onUp)
    dom.addEventListener('pointerleave', onLeave)
    dom.addEventListener('contextmenu', onCtx)
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointermove', onMove)
      dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointerleave', onLeave)
      dom.removeEventListener('contextmenu', onCtx)
    }
  }, [gl, camera, raycaster, plane])

  // reset transient ghosts on tool / floor change
  useEffect(() => {
    if (ghostRef.current) ghostRef.current.visible = cat === 'container'
    lastCell.current = { cx: NaN, cz: NaN }
    lastBayKey.current = null; lastPrevKey.current = null
    setGhostBay(null); setPreviewCells([])
    if (hovered.current != null) { hovered.current = null; onHover?.(null) }
    invalidate()
  }, [cat, tool, rot, activeFloor, onHover])

  const eraseMode = tool === 'erase'
  const hoverKey = hover ? (hover.id ?? hover.key) : null

  return (
    <group>
      <hemisphereLight args={['#eef3fa', '#4a5160', 1.05]} />
      <directionalLight position={[18, 26, 12]} intensity={1.3} color="#fff6ec" />
      <directionalLight position={[-14, 12, -10]} intensity={0.45} color="#cfe0f0" />
      <ambientLight intensity={0.45} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} raycast={() => null}>
        <planeGeometry args={[PLOT_M * 1.6, PLOT_M * 1.6]} />
        <meshBasicMaterial color="#2b303a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} raycast={() => null}>
        <planeGeometry args={[PLOT_M, PLOT_M]} />
        <meshBasicMaterial color="#3a4252" transparent opacity={0.55} />
      </mesh>

      {/* ground dot lattice (containers auto-stack onto roofs) */}
      <DotGrid y={0.01} opacity={0.6} />

      {/* placed containers — all storeys always visible so roofs are clickable */}
      <group ref={modulesGroupRef}>
        {modules.map((m) => (
          <BuildModule key={m.id} mod={m} geo={geo} color={cladColor} dim={false}
            selected={m.id === selectedId}
            hover={cat === 'pick' && hover?.kind === 'module' && hover.id === m.id}
            eraseMode={eraseMode} />
        ))}
      </group>

      {/* placed openings / solar / terrace */}
      <group ref={openingsGroupRef}>
        {openings.map((o) => <OpeningPlate key={B.bayKey(o)} o={o} geo={geo} hot={hover?.kind === 'opening' && hoverKey === B.bayKey(o)} />)}
      </group>
      <group ref={solarGroupRef}>
        {solar.map((c) => <SolarTile key={B.solarKey(c)} c={c} geo={geo} hot={hover?.kind === 'solar' && hoverKey === B.solarKey(c)} />)}
      </group>
      <group ref={terraceGroupRef}>
        {terrace.map((c) => <TerraceTile key={B.terraceKey(c)} c={c} geo={geo} hot={hover?.kind === 'terrace' && hoverKey === B.terraceKey(c)} />)}
      </group>

      {/* tool grids */}
      {cat === 'opening' && <group ref={bayTargetsRef}><BayGrid bays={bays} openings={openings} /></group>}
      {cat === 'solar' && <group ref={roofTargetsRef}><RoofGrid cells={roofCs} solar={solar} /></group>}

      {/* container ghost */}
      {ghostDims && (
        <mesh ref={ghostRef} geometry={geo} scale={[ghostDims[0], MODULE_H, ghostDims[1]]} raycast={() => null} renderOrder={3}>
          <meshBasicMaterial ref={ghostMatRef} color={C_VALID} transparent opacity={0.5} depthWrite={false} />
          <Edges threshold={15} color="#ffffff" renderOrder={4} raycast={() => null} />
        </mesh>
      )}

      {/* opening ghost */}
      {cat === 'opening' && ghostBay && (() => {
        const bw = B.bayWorld(ghostBay)
        const isDoor = tool === 'door'
        const dimO = isDoor ? B.DOOR : B.WINDOW
        const cy = isDoor ? dimO.h / 2 : dimO.sill + dimO.h / 2
        const exists = openings.some((o) => B.bayKey(o) === B.bayKey(ghostBay))
        return (
          <group position={[bw.pos[0], bw.floorBottom, bw.pos[2]]} rotation={[0, bw.ry, 0]} raycast={() => null} renderOrder={4}>
            <mesh geometry={geo} position={[0, cy, 0.07]} scale={[dimO.w, dimO.h, 0.1]} raycast={() => null}>
              <meshBasicMaterial color={exists ? '#ff7a3d' : '#37d27a'} transparent opacity={0.55} depthWrite={false} />
              <Edges threshold={15} color="#ffffff" raycast={() => null} />
            </mesh>
          </group>
        )
      })()}

      {/* solar / terrace ghost (single cell or drag trail) */}
      {(cat === 'solar' || cat === 'terrace') && previewCells.map((c, i) => {
        const w = cat === 'solar' ? B.solarWorld(c) : B.terraceWorld(c)
        const col = previewOk ? '#37d27a' : '#ff4d4f'
        const h = cat === 'solar' ? 0.08 : w.y
        const y = cat === 'solar' ? w.y + 0.07 : w.y / 2
        return (
          <mesh key={i} geometry={geo} position={[w.cx, y, w.cz]} scale={[CELL * 0.96, h, CELL * 0.96]} raycast={() => null} renderOrder={4}>
            <meshBasicMaterial color={col} transparent opacity={0.5} depthWrite={false} />
            <Edges threshold={15} color="#ffffff" raycast={() => null} />
          </mesh>
        )
      })}

      <BuildCamera controlsRef={controlsRef} apiRef={cameraApiRef} modules={modules} />
      <OrbitControls
        ref={controlsRef} makeDefault enablePan enableDamping dampingFactor={0.12}
        minDistance={5} maxDistance={PLOT_M * 1.3} maxPolarAngle={Math.PI * 0.49} zoomToCursor
        onChange={() => invalidate()}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </group>
  )
}
