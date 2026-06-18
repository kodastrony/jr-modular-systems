import { Link } from 'react-router-dom'
import Reveal from './Reveal.jsx'
import { Arrow, ArrowUpRight } from './Icons.jsx'

export function SectionHead({ eyebrow, title, lead, center, light }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''}`}>
      {eyebrow && <span className={`eyebrow ${light ? '' : ''}`}>{eyebrow}</span>}
      <h2 className="h2 balance">{title}</h2>
      {lead && <p className="lead balance">{lead}</p>}
    </Reveal>
  )
}

export function Stat({ value, accent, label }) {
  return (
    <div className="stat">
      <div className="num">{accent ? <em>{value}</em> : value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export function OfferCard({ item, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <Link to={`/oferta/${item.slug}`} className="card offer-card">
        <div className="media"><img src={item.hero} alt={item.title} loading="lazy" /></div>
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
