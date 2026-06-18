import { useParams, Link, Navigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { Cube, Arrow, Check, ArrowUpRight } from '../components/Icons.jsx'
import { offerBySlug, offer } from '../data/content.js'

export function OfferView({ item }) {
  const others = offer.filter((o) => o.slug !== item.slug).slice(0, 3)
  return (
    <>
      {/* hero with image */}
      <section className="page-hero with-image">
        <div className="page-hero-media"><img src={item.hero} alt={item.title} /></div>
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/">Start</Link><span className="sep">/</span>
            <Link to="/oferta">Oferta</Link><span className="sep">/</span><span>{item.title}</span>
          </div>
          <Reveal>
            <h1 className="display h1" style={{ maxWidth: '16ch' }}>{item.title}</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '58ch' }}>{item.lead}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 18, height: 18 }} /> Zaprojektuj w 3D</Link>
              <Link to="/kontakt" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.32)' }}>Zapytaj o wycenę <Arrow style={{ width: 17, height: 17 }} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* highlights chips */}
      <section className="section-sm">
        <div className="container">
          <Reveal className="chips">
            {item.highlights.map((h) => <span key={h} className="chip"><Check style={{ width: 15, height: 15, color: 'var(--accent)', display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />{h}</span>)}
          </Reveal>
        </div>
      </section>

      {/* prose sections + gallery alternating */}
      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container">
          {item.sections.map((s, i) => (
            <Reveal key={i} className="feature-row" style={{ marginBottom: 'clamp(40px,6vw,90px)', flexDirection: i % 2 ? 'row-reverse' : 'row' }}>
              {item.gallery[i] && (
                <div className="feature-media" style={{ order: i % 2 ? 2 : 0 }}>
                  <img src={item.gallery[i]} alt={s.heading} loading="lazy" />
                </div>
              )}
              <div className="feature-text prose">
                {s.heading && <h2 className="h3" style={{ marginBottom: 16 }}>{s.heading}</h2>}
                {s.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* gallery grid (remaining images) */}
      {item.gallery.length > item.sections.length && (
        <section className="section-sm soft">
          <div className="container">
            <div className="grid cols-3">
              {item.gallery.slice(item.sections.length).map((g, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="card" style={{ aspectRatio: '4/3' }}><img src={g} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* cross-sell */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <h2 className="h3">Zobacz też</h2>
            <Link to="/oferta" className="textlink">Cała oferta <ArrowUpRight /></Link>
          </div>
          <div className="grid cols-3">
            {others.map((o) => (
              <Reveal key={o.slug}>
                <Link to={`/oferta/${o.slug}`} className="card offer-card">
                  <div className="media"><img src={o.hero} alt={o.title} loading="lazy" /></div>
                  <div className="body"><h3>{o.title}</h3><p>{o.short}</p></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default function OfferPage() {
  const { slug } = useParams()
  const item = offerBySlug[slug]
  if (!item) return <Navigate to="/oferta" replace />
  return <OfferView item={item} />
}
