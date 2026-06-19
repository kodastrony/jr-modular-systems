import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import Layout from './components/Layout.jsx'
import { company } from './data/content.js'
import { Cube, Arrow } from './components/Icons.jsx'
import Home from './pages/Home.jsx'
import OfferIndex from './pages/OfferIndex.jsx'
import OfferPage from './pages/OfferPage.jsx'
import About from './pages/About.jsx'
import Technology from './pages/Technology.jsx'
import Faq from './pages/Faq.jsx'
import Realizacje from './pages/Realizacje.jsx'
import UsedContainers from './pages/UsedContainers.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'

// Three.js / R3F is heavy — split the configurator into its own chunk so
// content pages never download it.
const Configurator = lazy(() => import('./pages/Configurator.jsx'))

const NARROW = '(max-width: 820px)'

/* The 3D configurator needs a larger screen + pointer; on phones / narrow windows
   we show a friendly notice INSTEAD of mounting it — which also means the heavy
   Three.js chunk is never downloaded on mobile. Updates live on resize/rotate. */
function ConfiguratorRoute() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(NARROW).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (narrow) return <ConfiguratorDesktopOnly />
  return (
    <Suspense fallback={<div className="cfg-loader"><div className="spin" /></div>}>
      <Configurator />
    </Suspense>
  )
}

function ConfiguratorDesktopOnly() {
  return (
    <div className="cfg-desktop-only">
      <Link to="/" className="cdo-brand"><img src={company.logoMark} alt="" /> JR Modular<span> Systems</span></Link>
      <div className="cdo-card">
        <div className="cdo-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="4" width="19" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
            <path d="M7.5 9.5 10 12l-2.5 2.5M13.5 14.5H17" />
          </svg>
        </div>
        <h1>Konfigurator 3D działa na komputerze</h1>
        <p>Projektowanie obiektu w 3D jest wygodne na większym ekranie z myszą — dlatego, aby zapewnić Ci najlepsze i płynne doświadczenie, kreator otwórz na komputerze. Na telefonie zapraszamy do oferty i kontaktu.</p>
        <div className="cdo-actions">
          <Link to="/oferta" className="btn btn-accent btn-lg"><Cube style={{ width: 18, height: 18 }} /> Zobacz ofertę</Link>
          <Link to="/kontakt" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Skontaktuj się <Arrow style={{ width: 16, height: 16 }} /></Link>
        </div>
        <Link to="/" className="cdo-home">← Wróć na stronę główną</Link>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Configurator is full-screen, outside the standard layout */}
        <Route path="/konfigurator" element={<ConfiguratorRoute />} />

        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/oferta" element={<OfferIndex />} />
          <Route path="/oferta/:slug" element={<OfferPage />} />
          <Route path="/o-nas" element={<About />} />
          <Route path="/technologia" element={<Technology />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/realizacje" element={<Realizacje />} />
          <Route path="/kontenery-uzywane" element={<UsedContainers />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
