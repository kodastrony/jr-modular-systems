import { Component, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfiguratorCanvas from '../three/builder/ConfiguratorCanvas.jsx'
import { company } from '../data/content.js'
import {
  Arrow, Download, Close, Mail, Trash, Plus, Check,
  Rotate, Undo, Redo, Cursor, Eraser, Fit, TopDown, Wand, ChevronUp, ChevronDown, Layers,
  DoorIcon, WindowIcon, SolarIcon, DeckIcon,
} from '../components/Icons.jsx'
import * as B from '../data/builder.js'

const STORAGE_KEY = 'jr-konfigurator-v3'
const FLOOR_LABEL = ['Parter', '1. piętro', '2. piętro', '3. piętro']

const ADDON_TOOLS = [
  { id: 'door', name: 'Drzwi', key: 'D', Icon: DoorIcon, hint: 'Kliknij przęsło ściany zewnętrznej, aby wstawić drzwi (ponowny klik usuwa).' },
  { id: 'window', name: 'Okno', key: 'W', Icon: WindowIcon, hint: 'Kliknij przęsło ściany zewnętrznej, aby wstawić okno.' },
  { id: 'solar', name: 'Panele PV', key: 'S', Icon: SolarIcon, hint: 'Przeciągnij po dachu, aby pokryć panelami (tylko wierzch kontenerów).' },
  { id: 'terrace', name: 'Taras', key: 'T', Icon: DeckIcon, hint: 'Przeciągnij po wolnym gruncie obok budynku, aby ułożyć taras.' },
]

const DEFAULT_FINISH = { cladding: 'graphite', roof: 'flat', tier: 'plus' }
const EMPTY_ADDONS = { openings: [], solar: [], terrace: [] }

/* recover gracefully if the 3D subtree throws — never leave a blank page */
class SceneBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  reset = () => { try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ } location.reload() }
  render() {
    if (this.state.err) {
      return (
        <div className="cfg-loader" style={{ background: 'var(--bg-dark)' }}>
          <div style={{ textAlign: 'center', maxWidth: 360, padding: 24 }}>
            <div style={{ color: 'var(--on-dark)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Coś poszło nie tak ze sceną 3D</div>
            <div style={{ color: 'var(--on-dark-soft)', fontSize: '0.9rem', marginBottom: 18 }}>Zresetuj projekt, aby wrócić do pustego placu.</div>
            <button className="cfg-pill primary" onClick={this.reset}>Zresetuj projekt</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ---------------- history reducer ---------------- */
function reducer(state, action) {
  const { project, past, future } = state
  switch (action.type) {
    case 'commit': {
      if (action.next === project) return state
      return { project: action.next, past: [...past.slice(-49), project], future: [] }
    }
    case 'silent':
      return { ...state, project: action.next }
    case 'undo': {
      if (!past.length) return state
      return { project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future].slice(0, 50) }
    }
    case 'redo': {
      if (!future.length) return state
      return { project: future[0], past: [...past.slice(-49), project], future: future.slice(1) }
    }
    default:
      return state
  }
}

function initState() {
  // Start on an empty plot — no auto-placed containers when entering the configurator.
  let project = { modules: [], ...EMPTY_ADDONS, finish: { ...DEFAULT_FINISH } }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && Array.isArray(saved.modules) && saved.modules.length) {
      // re-stamp ids through nextId so the sequence never collides with new ones
      const modules = saved.modules.map((m) => ({ ...m, id: B.nextId() }))
      project = B.pruneAddons({
        modules,
        openings: Array.isArray(saved.openings) ? saved.openings : [],
        solar: Array.isArray(saved.solar) ? saved.solar : [],
        terrace: Array.isArray(saved.terrace) ? saved.terrace : [],
        finish: { ...DEFAULT_FINISH, ...(saved.finish || {}) },
      })
    }
  } catch { /* ignore */ }
  return { project, past: [], future: [] }
}

export default function Configurator() {
  const [{ project, past, future }, dispatch] = useReducer(reducer, undefined, initState)
  const { modules, finish } = project
  const openings = project.openings || EMPTY_ADDONS.openings
  const solar = project.solar || EMPTY_ADDONS.solar
  const terrace = project.terrace || EMPTY_ADDONS.terrace

  const [mode, setMode] = useState('build')
  // 'select' | 'erase' | 'm20' | 'm40' | 'door' | 'window' | 'solar' | 'terrace'
  const [tool, setTool] = useState('m20')
  const [rot, setRot] = useState(0)
  const [activeFloor, setActiveFloor] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [hover, setHover] = useState(null)   // { kind, id|key } currently under cursor
  const [hint, setHint] = useState(null)      // live validity reason while placing
  const [toast, setToast] = useState(null)    // transient action message
  const [ready, setReady] = useState(false)
  const [exportData, setExportData] = useState(null)

  const cameraApiRef = useRef(null)
  const captureRef = useRef(null)
  const toastTimer = useRef(null)
  const navigate = useNavigate()

  const isPlacing = tool === 'm20' || tool === 'm40'         // placing containers
  const isAnyPlacing = tool !== 'select' && tool !== 'erase' // any placing tool (shows a hint)
  const selected = useMemo(() => modules.find((m) => m.id === selectedId) || null, [modules, selectedId])

  /* ---- derived stats ---- */
  const area = useMemo(() => B.totalArea(modules), [modules])
  const floors = useMemo(() => B.floorsUsed(modules), [modules])
  const floorCounts = useMemo(() => {
    const c = [0, 0, 0]
    for (const m of modules) c[m.floor] = (c[m.floor] || 0) + 1
    return c
  }, [modules])
  const price = useMemo(() => B.computePrice(project), [project])
  const occ = useMemo(() => B.occupancyByFloor(modules), [modules])

  /* ---- persistence ---- */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)) } catch { /* ignore */ }
  }, [project])

  /* ---- helpers ---- */
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  // every module mutation re-validates add-ons (a new container may bury a
  // terrace / roof solar; a removed one orphans its openings) via pruneAddons.
  const commitModules = useCallback((nextModules) => {
    dispatch({ type: 'commit', next: B.pruneAddons({ ...project, modules: nextModules }) })
  }, [project])

  const placeModule = useCallback((cand) => {
    const v = B.validatePlacement(cand, modules)
    if (!v.ok) { showToast(B.REASON_TEXT[v.reason] || 'Niedozwolone'); return }
    const next = [...modules, { ...cand, id: B.nextId() }]
    dispatch({ type: 'commit', next: B.pruneAddons({ ...project, modules: next }) })
  }, [project, modules, showToast])

  const eraseModule = useCallback((id) => {
    const after = modules.filter((m) => m.id !== id)
    const { modules: pruned, removed } = B.pruneFloating(after)
    dispatch({ type: 'commit', next: B.pruneAddons({ ...project, modules: pruned }) })
    if (removed.length) showToast(`Usunięto też ${removed.length} modułów bez podparcia`)
    if (selectedId === id || removed.some((m) => m.id === selectedId)) setSelectedId(null)
  }, [project, modules, selectedId, showToast])

  const updateModule = useCallback((id, patch) => {
    const target = modules.find((m) => m.id === id)
    if (!target) return false
    const candidate = { ...target, ...patch }
    const v = B.validatePlacement(candidate, modules)
    if (!v.ok) { showToast(B.REASON_TEXT[v.reason] || 'Niedozwolone'); return false }
    const next = modules.map((m) => (m.id === id ? candidate : m))
    const { modules: pruned, removed } = B.pruneFloating(next)
    dispatch({ type: 'commit', next: B.pruneAddons({ ...project, modules: pruned }) })
    if (removed.length) showToast(`Usunięto ${removed.length} modułów bez podparcia`)
    return true
  }, [project, modules, showToast])

  /* ---- add-on handlers (doors/windows on bays, solar on roof, terrace on ground) ---- */
  const placeOpening = useCallback((bay, type) => {
    if (!B.isBayExterior(bay, occ)) { showToast('Tylko ściana zewnętrzna'); return }
    const key = B.bayKey(bay)
    const existing = openings.find((o) => B.bayKey(o) === key)
    let next
    if (existing) next = existing.type === type
      ? openings.filter((o) => B.bayKey(o) !== key)              // same type → remove
      : openings.map((o) => (B.bayKey(o) === key ? { ...o, type } : o)) // swap door↔window
    else next = [...openings, { x: bay.x, z: bay.z, side: bay.side, floor: bay.floor, type }]
    dispatch({ type: 'commit', next: { ...project, openings: next } })
  }, [project, openings, occ, showToast])

  const placeSolar = useCallback((cells) => {
    const have = new Set(solar.map(B.solarKey))
    const add = cells.filter((c) => B.isRoofCell(c, modules) && !have.has(B.solarKey(c)))
    if (!add.length) return
    dispatch({ type: 'commit', next: { ...project, solar: [...solar, ...add] } })
  }, [project, solar, modules])

  const placeTerrace = useCallback((cells) => {
    const have = new Set(terrace.map(B.terraceKey))
    const add = cells.filter((c) => B.isGroundFree(c.x, c.z, occ) && !have.has(B.terraceKey(c)))
    if (!add.length) return
    dispatch({ type: 'commit', next: { ...project, terrace: [...terrace, ...add] } })
  }, [project, terrace, occ])

  // erase any element under the cursor (erase tool)
  const eraseElement = useCallback((t) => {
    if (!t) return
    if (t.kind === 'module') { eraseModule(t.id); return }
    if (t.kind === 'opening') dispatch({ type: 'commit', next: { ...project, openings: openings.filter((o) => B.bayKey(o) !== t.key) } })
    else if (t.kind === 'solar') dispatch({ type: 'commit', next: { ...project, solar: solar.filter((c) => B.solarKey(c) !== t.key) } })
    else if (t.kind === 'terrace') dispatch({ type: 'commit', next: { ...project, terrace: terrace.filter((c) => B.terraceKey(c) !== t.key) } })
  }, [project, openings, solar, terrace, eraseModule])

  const rotateModule = useCallback((id) => {
    const m = modules.find((x) => x.id === id)
    if (m) updateModule(id, { rot: m.rot ? 0 : 1 })
  }, [modules, updateModule])

  const moveFloor = useCallback((id, delta) => {
    const m = modules.find((x) => x.id === id)
    if (!m) return
    const f = m.floor + delta
    if (f < 0 || f >= B.MAX_FLOORS) return
    updateModule(id, { floor: f })
  }, [modules, updateModule])

  const duplicateModule = useCallback((id) => {
    const m = modules.find((x) => x.id === id)
    if (!m) return
    // try to drop the copy just beside the original on the long axis
    const { w } = B.footprintDims(m.type, m.rot)
    for (const dx of [w, -w, 0]) {
      const cand = { ...m, cx: m.cx + dx, cz: m.cz + (dx === 0 ? 2 : 0) }
      if (B.validatePlacement(cand, modules).ok) {
        const id2 = B.nextId()
        commitModules([...modules, { ...cand, id: id2 }])
        setSelectedId(id2)
        return
      }
    }
    showToast('Brak miejsca na kopię obok')
  }, [modules, commitModules, showToast])

  const loadPreset = useCallback((preset) => {
    dispatch({ type: 'commit', next: { modules: B.modulesFromPreset(preset), ...EMPTY_ADDONS, finish: { ...finish, cladding: preset.cladding, roof: preset.roof } } })
    setSelectedId(null)
    setActiveFloor(0)
    setTool('select')
    requestAnimationFrame(() => cameraApiRef.current?.fit())
  }, [finish])

  const clearAll = useCallback(() => {
    if (!modules.length && !openings.length && !solar.length && !terrace.length) return
    dispatch({ type: 'commit', next: { modules: [], ...EMPTY_ADDONS, finish } })
    setSelectedId(null)
    setActiveFloor(0)
  }, [modules.length, openings.length, solar.length, terrace.length, finish])

  const patchFinish = useCallback((patch) => {
    dispatch({ type: 'commit', next: { ...project, finish: { ...finish, ...patch } } })
  }, [project, finish])

  const selectTool = useCallback((t) => {
    setTool(t)
    setHover(null)
    if (t !== 'select') setSelectedId(null)
  }, [])

  const onSelectModule = useCallback((id) => { setTool('select'); setSelectedId(id) }, [])

  const generate = useCallback(() => {
    if (!modules.length) { showToast('Najpierw postaw choć jeden moduł'); return }
    setSelectedId(null)
    setHint(null)
    setMode('present')
  }, [modules.length, showToast])

  const editAgain = useCallback(() => { setMode('build'); setExportData(null) }, [])
  const openExport = useCallback(() => {
    setExportData({ url: captureRef.current ? captureRef.current() : null })
  }, [])

  /* Hand the finished project off to the contact form: a text summary + a
     downscaled snapshot, stashed in sessionStorage, then route to /kontakt
     where it is shown and pre-filled into the message. No price anywhere. */
  const goToContact = useCallback(() => {
    const clad = B.claddingById[finish.cladding]?.name || '—'
    const roof = B.roofById[finish.roof]?.name || '—'
    const tier = B.tierById[finish.tier]?.name || '—'
    const doors = openings.filter((o) => o.type === 'door').length
    const windows = openings.filter((o) => o.type === 'window').length
    const addons = [
      doors ? `${doors} × drzwi` : '', windows ? `${windows} × okno` : '',
      solar.length ? `${solar.length} × panel PV` : '', terrace.length ? `${terrace.length} × kafel tarasu` : '',
    ].filter(Boolean)
    const summary = [
      `Moduły: ${modules.length} szt.`, `Kondygnacje: ${floors}`, `Powierzchnia: ~${area} m²`,
      `Elewacja: ${clad}`, `Dach: ${roof}`, `Standard: ${tier}`,
      addons.length ? `Dodatki: ${addons.join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const payload = (image) => {
      const data = { summary, image, stats: { modules: modules.length, floors, area, cladding: clad, roof, tier, addons }, ts: Date.now() }
      try { sessionStorage.setItem('jr-cfg-handoff', JSON.stringify(data)) }
      catch { try { sessionStorage.setItem('jr-cfg-handoff', JSON.stringify({ ...data, image: null })) } catch { /* ignore */ } }
      navigate('/kontakt')
    }

    const raw = captureRef.current ? captureRef.current() : null
    if (!raw) { payload(null); return }
    const im = new Image()
    im.onload = () => {
      try {
        const W = 1100, H = Math.round(W * im.height / im.width)
        const c = document.createElement('canvas'); c.width = W; c.height = H
        c.getContext('2d').drawImage(im, 0, 0, W, H)
        payload(c.toDataURL('image/jpeg', 0.82))
      } catch { payload(null) }
    }
    im.onerror = () => payload(null)
    im.src = raw
  }, [navigate, finish, modules.length, floors, area, openings, solar, terrace])

  /* ---- keyboard ---- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (mode !== 'build') {
        if (e.key === 'Escape') editAgain()
        return
      }
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'undo' }); return }
      if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: 'redo' }); return }
      if (k === 'r') { selected ? rotateModule(selected.id) : setRot((r) => (r ? 0 : 1)) }
      else if (k === 'delete' || k === 'backspace') { if (selected) eraseModule(selected.id) }
      else if (k === 'escape') { setSelectedId(null) }
      else if (k === 'v') selectTool('select')
      else if (k === 'e') selectTool('erase')
      else if (k === 'd') selectTool('door')
      else if (k === 'w') selectTool('window')
      else if (k === 's') selectTool('solar')
      else if (k === 't') selectTool('terrace')
      else if (k === 'g') generate()
      else if (k === 'f') cameraApiRef.current?.fit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, selected, rotateModule, eraseModule, selectTool, generate, editAgain])

  /* ---- DEV test hook: drive the real handlers deterministically ---- */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__cfgTest = {
      get modules() { return modules },
      get finish() { return finish },
      get project() { return project },
      get openings() { return openings },
      get solar() { return solar },
      get terrace() { return terrace },
      get state() { return { mode, tool, rot, activeFloor, selectedId, count: modules.length, area, floors, openings: openings.length, solar: solar.length, terrace: terrace.length } },
      place: (cand) => placeModule(cand),
      erase: (id) => eraseModule(id),
      rotate: (id) => rotateModule(id),
      moveFloor: (id, d) => moveFloor(id, d),
      setFloor: setActiveFloor,
      placeOpening, placeSolar, placeTerrace, eraseElement,
      selectTool, setRot, loadPreset, clearAll, generate, editAgain,
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      validate: (cand) => B.validatePlacement(cand, modules),
      worldOf: (m) => B.worldPosition(m),
      B,
    }
  })

  /* ---- canvas props ---- */
  const canvasProps = {
    mode, modules, openings, solar, terrace, finish, activeFloor, tool, rot, selectedId, hover,
    onPlace: placeModule, onSelectModule, onEraseModule: eraseModule,
    onPlaceOpening: placeOpening, onPlaceSolar: placeSolar, onPlaceTerrace: placeTerrace, onEraseElement: eraseElement,
    onHover: setHover, onHint: setHint, cameraApiRef, captureRef, onReady: () => setReady(true),
  }

  const hintText = hint && (B.REASON_TEXT[hint] || null)

  return (
    <div className="cfg-stage">
      <div className="cfg-scene">
        <SceneBoundary>
          <ConfiguratorCanvas {...canvasProps} />
        </SceneBoundary>
      </div>

      {mode === 'build'
        ? <BuildUI {...{
            modules, area, floors, floorCounts, tool, rot, activeFloor, selected, isAnyPlacing,
            openings, solar, terrace, past, future, hintText, toast,
            selectTool, setRot, setActiveFloor, clearAll, generate,
            dispatch, cameraApiRef, eraseModule, rotateModule, moveFloor, duplicateModule, setSelectedId,
          }} />
        : <PresentUI {...{ area, floors, price, finish, patchFinish, editAgain, openExport, goToContact, cameraApiRef }} />}

      {!ready && (
        <div className="cfg-loader">
          <div style={{ textAlign: 'center' }}>
            <div className="spin" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--on-dark-soft)', fontSize: '0.9rem', letterSpacing: '0.04em' }}>Ładowanie konfiguratora 3D…</div>
          </div>
        </div>
      )}

      {exportData && <ExportModal data={exportData} project={project} stats={{ area, floors, price }} onClose={() => setExportData(null)} onContact={goToContact} />}
    </div>
  )
}

/* =================================================================
   BUILD MODE UI
   ================================================================= */
function BuildUI({
  modules, area, floors, floorCounts, tool, rot, activeFloor, selected, isAnyPlacing,
  openings, solar, terrace, past, future, hintText, toast,
  selectTool, setRot, setActiveFloor, clearAll, generate,
  dispatch, cameraApiRef, eraseModule, rotateModule, moveFloor, duplicateModule, setSelectedId,
}) {
  const empty = !modules.length && !openings.length && !solar.length && !terrace.length
  const addonCount = openings.length + solar.length + terrace.length
  return (
    <div className="cfg-ui">
      {/* top bar */}
      <header className="cfg-bar">
        <Link to="/" className="cfg-pill ghost"><Arrow style={{ width: 15, height: 15, transform: 'scaleX(-1)' }} /> Strona główna</Link>
        <div className="cfg-brand"><img src={company.logoMark} alt="" /> Kreator <span className="muted">3D</span></div>
        <div className="cfg-bar-spacer" />
        <span className="cfg-meta">{modules.length} mod. · ~{area} m² · {floors} kond.{addonCount ? ` · ${addonCount} dod.` : ''}</span>
        <div className="cfg-iconbtns">
          <button className="cfg-iconbtn" disabled={!past.length} onClick={() => dispatch({ type: 'undo' })} title="Cofnij (Ctrl+Z)"><Undo /></button>
          <button className="cfg-iconbtn" disabled={!future.length} onClick={() => dispatch({ type: 'redo' })} title="Ponów (Ctrl+Y)"><Redo /></button>
        </div>
        <button className="cfg-pill primary" onClick={generate}><Wand style={{ width: 16, height: 16 }} /> Generuj wizualizację</button>
      </header>

      {/* left dock */}
      <div className="cfg-console builder">
        <div className="cfg-console-body">
          <section className="bld-sec">
            <div className="bld-h">Narzędzie</div>
            <div className="bld-tools">
              <button className={`bld-tool ${tool === 'select' ? 'on' : ''}`} onClick={() => selectTool('select')} title="Wybierz (V)"><Cursor /><span>Wybierz</span></button>
              <button className={`bld-tool ${tool === 'erase' ? 'on' : ''}`} onClick={() => selectTool('erase')} title="Usuń (E)"><Eraser /><span>Usuń</span></button>
            </div>
            <p className="bld-hint-txt">Gumka usuwa cokolwiek pod kursorem — moduł, drzwi, okno, panel czy taras.</p>
          </section>

          <section className="bld-sec">
            <div className="bld-h">Moduły — kliknij, potem postaw na placu</div>
            <div className="bld-palette">
              {B.MODULE_TYPES.map((t) => (
                <button key={t.id} className={`bld-mod ${tool === t.id ? 'on' : ''}`} onClick={() => selectTool(t.id)}>
                  <ModuleGlyph type={t.id} />
                  <div className="bld-mod-lbl"><b>{t.name}</b><span>{t.desc}</span></div>
                </button>
              ))}
            </div>
            <button className="bld-rotate" onClick={() => setRot((r) => (r ? 0 : 1))} title="Obróć (R)">
              <Rotate /> Obrót {rot ? '90°' : '0°'} <kbd>R</kbd>
            </button>
            <p className="bld-hint-txt">Najedź na <b style={{ color: 'var(--on-dark)' }}>dach kontenera</b>, aby postawić moduł piętro wyżej — albo na wolny plac, by ustawić go na ziemi.</p>
          </section>

          <section className="bld-sec">
            <div className="bld-h">Dodatki — na właściwych powierzchniach</div>
            <div className="bld-addons">
              {ADDON_TOOLS.map((a) => (
                <button key={a.id} className={`bld-addon ${tool === a.id ? 'on' : ''}`} onClick={() => selectTool(a.id)} title={a.hint}>
                  <a.Icon /><span>{a.name}</span><kbd>{a.key}</kbd>
                </button>
              ))}
            </div>
            {ADDON_TOOLS.find((a) => a.id === tool) && (
              <p className="bld-hint-txt">{ADDON_TOOLS.find((a) => a.id === tool).hint}</p>
            )}
          </section>

          <section className="bld-sec">
            <button className="bld-clear" onClick={clearAll} disabled={empty}><Trash style={{ width: 15, height: 15 }} /> Wyczyść plac</button>
          </section>
        </div>
      </div>

      {/* selected-module editor */}
      {selected && (
        <div className="cfg-editor">
          <span className="lab">{B.moduleTypeById[selected.type]?.name} · {FLOOR_LABEL[selected.floor]}</span>
          <button className="x" onClick={() => rotateModule(selected.id)} title="Obróć"><Rotate style={{ width: 17, height: 17 }} /></button>
          <button className="x" onClick={() => duplicateModule(selected.id)} title="Duplikuj"><Plus style={{ width: 17, height: 17 }} /></button>
          <div className="cfg-seg-row">
            <button className="cfg-seg-btn" onClick={() => moveFloor(selected.id, -1)} disabled={selected.floor === 0} title="Niżej"><ChevronDown style={{ width: 15, height: 15 }} /></button>
            <span style={{ minWidth: 16, textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>{selected.floor + 1}</span>
            <button className="cfg-seg-btn" onClick={() => moveFloor(selected.id, 1)} disabled={selected.floor >= B.MAX_FLOORS - 1} title="Wyżej"><ChevronUp style={{ width: 15, height: 15 }} /></button>
          </div>
          <button className="x del" onClick={() => eraseModule(selected.id)} title="Usuń"><Trash style={{ width: 16, height: 16 }} /></button>
          <button className="x" onClick={() => setSelectedId(null)} title="Zamknij"><Close style={{ width: 16, height: 16 }} /></button>
        </div>
      )}

      {/* camera controls */}
      <div className="bld-camera">
        <button className="cfg-iconbtn solid" onClick={() => cameraApiRef.current?.fit()} title="Dopasuj (F)"><Fit /></button>
        <button className="cfg-iconbtn solid" onClick={() => cameraApiRef.current?.topView()} title="Widok z góry"><TopDown /></button>
      </div>

      {/* empty-state coach + live hint + toast */}
      {empty && (
        <div className="bld-empty">
          <Wand style={{ width: 26, height: 26, opacity: 0.5 }} />
          <b>Zbuduj swój obiekt</b>
          <span>Wybierz moduł z lewej i kliknij na placu, by zacząć. Potem dodaj drzwi, okna, panele i taras.</span>
        </div>
      )}
      {isAnyPlacing && hintText && <div className="bld-hint invalid">{hintText}</div>}
      {toast && <div className="bld-toast">{toast}</div>}
    </div>
  )
}

/* =================================================================
   PRESENT MODE UI
   ================================================================= */
function PresentUI({ area, floors, price, finish, patchFinish, editAgain, openExport, goToContact, cameraApiRef }) {
  return (
    <div className="cfg-ui">
      <header className="cfg-bar">
        <button className="cfg-pill ghost" onClick={editAgain}><Arrow style={{ width: 15, height: 15, transform: 'scaleX(-1)' }} /> Edytuj projekt</button>
        <div className="cfg-brand"><img src={company.logoMark} alt="" /> Wizualizacja <span className="muted">3D</span></div>
        <div className="cfg-bar-spacer" />
        <span className="cfg-meta">~{area} m² · {floors} kond.</span>
        <button className="cfg-pill ghost" onClick={openExport}><Download style={{ width: 16, height: 16 }} /> Zapisz</button>
        <button className="cfg-pill primary" onClick={goToContact}><Mail style={{ width: 16, height: 16 }} /> Zamów wycenę</button>
      </header>

      <div className="cfg-console present">
        <div className="cfg-console-body">
          <section className="bld-sec">
            <div className="bld-h">Elewacja</div>
            <div className="cfg-row">
              {B.CLADDINGS.map((c) => (
                <button key={c.id} className={`cfg-swatch-lg ${finish.cladding === c.id ? 'active' : ''}`} onClick={() => patchFinish({ cladding: c.id })}>
                  <div className="sw" style={{ background: c.color }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="bld-sec">
            <div className="bld-h">Dach</div>
            <div className="cfg-row">
              {B.ROOFS.map((r) => (
                <button key={r.id} className={`cfg-opt ${finish.roof === r.id ? 'active' : ''}`} onClick={() => patchFinish({ roof: r.id })}>{r.name}</button>
              ))}
            </div>
          </section>
          <section className="bld-sec">
            <div className="bld-h">Standard</div>
            <div className="cfg-row">
              {B.TIERS.map((t) => (
                <button key={t.id} className={`cfg-opt ${finish.tier === t.id ? 'active' : ''}`} onClick={() => patchFinish({ tier: t.id })} title={t.desc}>{t.name}</button>
              ))}
            </div>
          </section>
          <section className="bld-sec">
            <div className="bld-h">Zestawienie dodatków</div>
            <div className="cfg-summary-rows">
              <div className="cfg-srow"><span className="k">Drzwi · okna</span><span className="v">{price.doors} · {price.windows}</span></div>
              <div className="cfg-srow"><span className="k">Panele PV</span><span className="v">{price.solar}</span></div>
              <div className="cfg-srow"><span className="k">Taras (kafle)</span><span className="v">{price.terrace}</span></div>
            </div>
            <p className="bld-hint-txt">Drzwi, okna, panele i taras dodajesz w trybie budowania.</p>
          </section>
          <div className="cfg-quote-cta">
            <p>Gotowy projekt? Wyślij go do nas — przygotujemy bezpłatną, niezobowiązującą wycenę i szczegóły realizacji.</p>
            <button className="btn btn-accent btn-sm" style={{ width: '100%' }} onClick={goToContact}><Mail style={{ width: 15, height: 15 }} /> Skontaktuj się z nami</button>
          </div>
        </div>
      </div>

      <div className="bld-camera">
        <button className="cfg-iconbtn solid" onClick={() => cameraApiRef.current?.iso?.()} title="Widok 3D"><Fit /></button>
        <button className="cfg-iconbtn solid" onClick={() => cameraApiRef.current?.front?.()} title="Z przodu"><Layers /></button>
        <button className="cfg-iconbtn solid" onClick={() => cameraApiRef.current?.top?.()} title="Z góry"><TopDown /></button>
      </div>
    </div>
  )
}

/* ---------------- small glyphs ---------------- */
function ModuleGlyph({ type }) {
  const long = type === 'm40'
  return (
    <svg viewBox="0 0 60 34" className="bld-mod-glyph" aria-hidden>
      <rect x={long ? 4 : 14} y="9" width={long ? 52 : 32} height="16" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
      {Array.from({ length: long ? 9 : 6 }).map((_, i) => (
        <line key={i} x1={(long ? 9 : 18) + i * (long ? 5.6 : 5)} y1="10" x2={(long ? 9 : 18) + i * (long ? 5.6 : 5)} y2="24" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      ))}
    </svg>
  )
}

const PRESET_PATHS = {
  row: 'M2 8h16v4H2zM2 13h16v4H2z',
  block: 'M3 6h14v12H3z',
  l: 'M3 4h6v12H3zM3 13h14v3H3z',
  u: 'M3 4h3v13H3zM14 4h3v13h-3zM3 14h14v3H3z',
  t: 'M3 4h14v3H3zM8 6h4v11H8z',
  o: 'M3 4h14v3H3zM3 14h14v3H3zM3 4h3v13H3zM14 4h3v13h-3z',
  stack: 'M4 11h12v6H4zM4 4h12v6H4z',
  setback: 'M3 11h14v6H3zM3 4h9v6H3z',
  cant: 'M3 11h10v6H3zM7 4h11v6H7z',
  storage: 'M2 5h16v4H2zM2 13h16v4H2z',
  glass: 'M3 6h14v11H3zM7 6v11M12 6v11',
  tower: 'M5 13h10v4H5zM5 8h10v4H5zM5 3h10v4H5z',
}
function PresetGlyph({ id }) {
  return (
    <svg viewBox="0 0 20 21" className="bld-preset-glyph" aria-hidden>
      <path d={PRESET_PATHS[id] || PRESET_PATHS.row} fill="rgba(255,255,255,0.14)" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------- export modal ---------------- */
function ExportModal({ data, project, stats, onClose, onContact }) {
  const { modules, finish } = project
  const clad = B.claddingById[finish.cladding]?.name
  const roof = B.roofById[finish.roof]?.name
  const p = stats.price
  const addonParts = [
    p.doors ? `${p.doors} drzwi` : '', p.windows ? `${p.windows} okien` : '',
    p.solar ? `${p.solar} paneli PV` : '', p.terrace ? `${p.terrace} kafli tarasu` : '',
  ].filter(Boolean)
  const addons = addonParts

  const download = () => {
    if (!data.url) return
    const a = document.createElement('a')
    a.href = data.url; a.download = 'projekt-jr-modular.png'; a.click()
  }
  const printPdf = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const addonsRow = addons.length ? `<tr><td>Dodatki</td><td>${addons.join(', ')}</td></tr>` : ''
    w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Projekt — JR Modular Systems</title>
      <style>body{font-family:Inter,Arial,sans-serif;color:#1d1d1f;max-width:780px;margin:32px auto;padding:0 24px}
      h1{font-size:24px;margin:0 0 4px}.sub{color:#6e6e73;margin:0 0 22px}
      img{width:100%;border-radius:12px;border:1px solid #eee;margin-bottom:22px}
      table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:9px 4px;border-bottom:1px solid #eee;font-size:14px}
      td:first-child{color:#6e6e73;width:42%}</style></head><body>
      <h1>Projekt obiektu modułowego</h1><p class="sub">JR Modular Systems · ${company.email} · ${company.phone}</p>
      ${data.url ? `<img src="${data.url}" />` : ''}
      <table>
      <tr><td>Moduły</td><td>${modules.length} szt.</td></tr>
      <tr><td>Kondygnacje</td><td>${stats.floors}</td></tr>
      <tr><td>Powierzchnia</td><td>~${stats.area} m²</td></tr>
      <tr><td>Elewacja / dach</td><td>${clad} · ${roof}</td></tr>
      ${addonsRow}
      </table>
      <p style="color:#86868b;font-size:12px;margin-top:22px">Projekt poglądowy. Skontaktuj się z nami, aby otrzymać wycenę i szczegóły realizacji.</p>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300)}<\/script></body></html>`)
    w.document.close()
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Twój projekt</h3>
          <button className="modal-close" onClick={onClose}><Close style={{ width: 18, height: 18 }} /></button>
        </div>
        <div className="modal-body">
          {data.url && <div className="modal-summary-preview"><img src={data.url} alt="Podgląd projektu" /></div>}
          <div className="cfg-summary-rows" style={{ color: 'var(--ink)' }}>
            <div className="cfg-srow" style={{ borderColor: 'var(--line-2)' }}><span className="k" style={{ color: 'var(--muted)' }}>Moduły / kondygnacje</span><span className="v">{modules.length} · {stats.floors}</span></div>
            <div className="cfg-srow" style={{ borderColor: 'var(--line-2)' }}><span className="k" style={{ color: 'var(--muted)' }}>Elewacja / dach</span><span className="v">{clad} · {roof}</span></div>
            {addons.length > 0 && <div className="cfg-srow" style={{ borderColor: 'var(--line-2)' }}><span className="k" style={{ color: 'var(--muted)' }}>Dodatki</span><span className="v">{addons.join(', ')}</span></div>}
            <div className="cfg-srow" style={{ borderColor: 'var(--line-2)' }}><span className="k" style={{ color: 'var(--muted)' }}>Powierzchnia</span><span className="v">~{stats.area} m²</span></div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.86rem', margin: '16px 0 4px' }}>
            Zapisz projekt jako obraz lub PDF, albo wyślij go do nas — przygotujemy wycenę i szczegóły realizacji.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <button className="btn btn-dark" onClick={download} disabled={!data.url}><Download style={{ width: 16, height: 16 }} /> Pobierz PNG</button>
            <button className="btn btn-ghost" onClick={printPdf}><Download style={{ width: 16, height: 16 }} /> Zapisz PDF</button>
          </div>
          <button className="btn btn-accent btn-lg" style={{ width: '100%', marginTop: 10 }} onClick={() => { onClose(); onContact?.() }}><Mail style={{ width: 17, height: 17 }} /> Wyślij projekt do wyceny</button>
        </div>
      </div>
    </div>
  )
}
