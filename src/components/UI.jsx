import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal.jsx'
import Picture from './Picture.jsx'
import { Arrow, ArrowUpRight } from './Icons.jsx'

const prefersReduced = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function SectionHead({ eyebrow, title, lead, center, light }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="h2 balance">{title}</h2>
      {lead && <p className="lead balance">{lead}</p>}
    </Reveal>
  )
}

/* A stat figure. With a numeric `to` it counts up the first time it scrolls into
   view (easeOutCubic); with a non-numeric `value` it renders that node statically. */
export function Stat({ to, suffix = '', value, label, duration = 1500 }) {
  const isNum = typeof to === 'number'
  const ref = useRef(null)
  const [val, setVal] = useState(isNum && !prefersReduced ? 0 : to)
  useEffect(() => {
    if (!isNum) return
    const el = ref.current
    if (!el || prefersReduced || typeof IntersectionObserver === 'undefined') { setVal(to); return }
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration)
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.45 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to, duration, isNum])
  return (
    <div className="stat" ref={ref}>
      <div className="num">{isNum ? <>{val}<em>{suffix}</em></> : value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export function OfferCard({ item, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <Link to={`/oferta/${item.slug}`} className="card offer-card">
        <div className="media"><Picture src={item.hero} alt={item.title} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>
        <div className="body">
          <h3>{item.title}</h3>
          <p>{item.short}</p>
          <span className="textlink more">Zobacz ofertę <ArrowUpRight /></span>
        </div>
      </Link>
    </Reveal>
  )
}

export function CtaRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 30 }}>{children}</div>
}

export function PrimaryCta({ to, children }) {
  return <Link to={to} className="btn btn-accent btn-lg">{children} <Arrow style={{ width: 17, height: 17 }} /></Link>
}
