import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Layout from './components/Layout.jsx'
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
        <Route
          path="/konfigurator"
          element={
            <Suspense fallback={<div className="cfg-loader"><div className="spin" /></div>}>
              <Configurator />
            </Suspense>
          }
        />

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
