import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

/* Thin accent bar that tracks reading progress down the page. */
function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setP(max > 0 ? el.scrollTop / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return <div className="scroll-progress" style={{ transform: `scaleX(${p})` }} aria-hidden />
}

export default function Layout() {
  const { pathname } = useLocation()
  const dark = true // whole site uses a dark gray-black surface now
  return (
    <>
      <a href="#main" className="skip-link">Przejdź do treści</a>
      <ScrollProgress />
      <Header dark={dark} />
      <main id="main" tabIndex={-1}>
        <div key={pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  )
}
