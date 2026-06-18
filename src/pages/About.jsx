import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { Stat, SectionHead } from '../components/UI.jsx'
import { Check, Cube, Arrow } from '../components/Icons.jsx'
import { about, company } from '../data/content.js'

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>O nas</span></div>
          <Reveal>
            <span className="eyebrow">O firmie</span>
            <h1 className="display h1" style={{ marginTop: 16, maxWidth: '18ch' }}>{about.hero.headline}</h1>
            <p className="lead" style={{ marginTop: 20, maxWidth: '62ch' }}>{about.hero.sub}</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="feature-row">
            <div className="feature-media"><img src={about.image} alt="JR Modular Systems" loading="lazy" /></div>
            <div className="feature-text prose">
              {about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{company.hashtag}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <SectionHead eyebrow="Współpraca" title={about.whyHeading} />
          <div className="grid cols-2" style={{ gap: 18 }}>
            {about.why.map((w, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="card" style={{ background: 'var(--bg-soft)', padding: '24px 26px', display: 'flex', gap: 16, height: '100%' }}>
                  <div style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Check style={{ width: 22, height: 22 }} /></div>
                  <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>{w}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <Reveal className="stats">
            <Stat value={<>Gliwice</>} label="Główna siedziba" />
            <Stat value={<>Cała <em>PL</em></>} label="Zasięg + zagranica" />
            <Stat value={<>24<em>h</em></>} label="Reakcja na zgłoszenia" />
            <Stat value={<>100<em>%</em></>} label="Własna produkcja" />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 className="h2 balance">Poszukują Państwo ekspertów od budownictwa modułowego?</h2>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
              <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 18, height: 18 }} /> Konfigurator 3D</Link>
              <Link to="/kontakt" className="btn btn-ghost btn-lg">Kontakt <Arrow style={{ width: 17, height: 17 }} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
