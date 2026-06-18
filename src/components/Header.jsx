import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { nav, company, offer } from '../data/content.js'
import { Cube, Arrow } from './Icons.jsx'

export default function Header({ dark = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false); setOfferOpen(false) }, [pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : '' }, [open])

  const cls = `nav ${scrolled ? 'scrolled' : ''} ${dark && !scrolled ? 'on-dark' : ''}`

  return (
    <>
      <header className={cls}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label="JR Modular Systems — strona główna">
            <img src={company.logoMark} alt="" />
            <span>JR Modular<span style={{ opacity: 0.5 }}>&nbsp;Systems</span></span>
          </Link>

          <nav className="nav-links">
            {nav.map((item) =>
              item.children ? (
                <div className="nav-has-menu" key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    {item.label}
                  </NavLink>
                  <div className="nav-dropdown">
                    {item.children.map((c) => (
                      <Link key={c.to} to={c.to} className="nav-dd-item">
                        <img src={c.icon} alt="" />
                        <div>
                          <b>{c.label}</b>
                          <span>{c.short.slice(0, 42)}…</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <Link to="/konfigurator" className="btn btn-accent btn-sm nav-cta">
            <Cube style={{ width: 16, height: 16 }} /> Konfigurator 3D
          </Link>

          <button className={`nav-burger ${open ? 'open' : ''}`} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <span />
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      <div className={`drawer ${open ? 'open' : ''}`}>
        <Link to="/">Start</Link>
        <Link to="/o-nas">O nas</Link>
        <div className="drawer-group-label">Oferta</div>
        <div className="drawer-sub">
          {offer.map((o) => (
            <Link key={o.slug} to={`/oferta/${o.slug}`}>{o.title}</Link>
          ))}
        </div>
        <Link to="/technologia">Technologia</Link>
        <Link to="/realizacje">Realizacje</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/kontakt">Kontakt</Link>
        <Link to="/konfigurator" className="btn btn-accent btn-lg" style={{ marginTop: 22, width: '100%' }}>
          <Cube style={{ width: 18, height: 18 }} /> Konfigurator 3D <Arrow style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </>
  )
}
