import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { SectionHead } from '../components/UI.jsx'
import { Check, Cube, Arrow, Bolt, Layers, Truck, Leaf } from '../components/Icons.jsx'
import { technology } from '../data/content.js'

const ADV_ICONS = [Bolt, Layers, Truck, Leaf]

export default function Technology() {
  return (
    <>
      <section className="page-hero with-image" style={{ minHeight: '56vh' }}>
        <div className="page-hero-media"><img src={technology.hero.image} alt="Technologia modułowa" /></div>
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>Technologia</span></div>
          <Reveal>
            <span className="eyebrow" style={{ color: 'var(--accent-2)' }}>Technologia modułowa</span>
            <h1 className="display h1" style={{ marginTop: 14, maxWidth: '15ch' }}>{technology.hero.headline}</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '56ch' }}>{technology.hero.sub}</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow prose">
          {technology.intro.map((p, i) => <Reveal as="p" key={i}>{p}</Reveal>)}
        </div>
      </section>

      {/* advantages */}
      <section className="section-sm soft">
        <div className="container">
          <div className="grid cols-4">
            {technology.advantages.map((a, i) => {
              const Ico = ADV_ICONS[i % ADV_ICONS.length]
              return (
                <Reveal key={i} delay={i * 50}>
                  <div className="card" style={{ background: 'var(--bg-soft)', padding: '24px 22px', height: '100%' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', marginBottom: 14 }}><Ico style={{ width: 24, height: 24 }} /></div>
                    <p style={{ color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.5 }}>{a}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* alternating blocks */}
      <section className="section">
        <div className="container">
          {technology.blocks.map((b, i) => (
            <Reveal key={i} className="feature-row" style={{ marginBottom: 'clamp(40px,6vw,84px)', flexDirection: i % 2 ? 'row-reverse' : 'row' }}>
              <div className="feature-media" style={{ order: i % 2 ? 2 : 0 }}><img src={b.image} alt={b.heading} loading="lazy" /></div>
              <div className="feature-text">
                <h2 className="h3" style={{ marginBottom: 14 }}>{b.heading}</h2>
                <p className="body-lg">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-sm">
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 className="h2 balance">Poznajmy Twoją potrzebę i porozmawiajmy</h2>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
              <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 18, height: 18 }} /> Zaprojektuj w 3D</Link>
              <Link to="/faq" className="btn btn-ghost btn-lg">Pytania i odpowiedzi <Arrow style={{ width: 17, height: 17 }} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
