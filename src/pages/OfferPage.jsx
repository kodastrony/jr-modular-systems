import { useParams, Link, Navigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import Picture from '../components/Picture.jsx'
import { Mail, Arrow, Check, ArrowUpRight } from '../components/Icons.jsx'
import { offerBySlug, offer } from '../data/content.js'

export function OfferView({ item }) {
  const others = offer.filter((o) => o.slug !== item.slug).slice(0, 3)
  return (
    <>
      {/* hero with image */}
      <section className="page-hero with-image">
        <div className="page-hero-media"><Picture src={item.hero} alt={item.title} sizes="100vw" loading="eager" fetchpriority="high" /></div>
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/">Start</Link><span className="sep">/</span>
            <Link to="/oferta">Oferta</Link><span className="sep">/</span><span>{item.title}</span>
          </div>
          <Reveal>
            <h1 className="display h1" style={{ maxWidth: '16ch' }}>{item.title}</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '58ch' }}>{item.lead}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 18, height: 18 }} /> Zamów bezpłatną wycenę</Link>
              <Link to="/realizacje" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.32)' }}>Zobacz realizacje <Arrow style={{ width: 17, height: 17 }} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Co zyskujesz — direct facts, no wall of text */}
      <section className="section" style={{ paddingTop: 'clamp(40px,5vw,72px)' }}>
        <div className="container">
          <Reveal as="h2" className="h3" style={{ marginBottom: 26 }}>Co zyskujesz</Reveal>
          <div className="offer-facts">
            {item.highlights.map((h, i) => (
              <Reveal key={h} delay={i * 40} className="offer-fact">
                <span className="offer-fact-ic"><Check /></span>
                <span>{h}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* gallery — let the realisations speak */}
      <section className="section-sm soft">
        <div className="container">
          <Reveal as="h2" className="h3" style={{ marginBottom: 24 }}>Wybrane realizacje</Reveal>
          <div className="offer-gallery">
            {item.gallery.map((g, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="card" style={{ aspectRatio: '4 / 3', overflow: 'hidden' }}>
                  <Picture src={g} alt={`${item.title} — realizacja ${i + 1}`} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
                  <div className="media"><Picture src={o.hero} alt={o.title} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>
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
