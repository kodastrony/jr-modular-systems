import { useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { SectionHead, Stat, OfferCard } from '../components/UI.jsx'
import { Cube, Arrow, ArrowUpRight, Play } from '../components/Icons.jsx'
import { company, heroBadges, offer, processSteps, realizacje, clients, faq, media } from '../data/content.js'

export default function Home() {
  const [playing, setPlaying] = useState(false)

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-media">
          <video src={media.heroLoop} poster={media.poster} autoPlay muted loop playsInline />
        </div>
        <div className="hero-inner">
          <div className="container">
            <Reveal>
              <span className="eyebrow" style={{ color: 'var(--accent-2)' }}>{company.hashtag}</span>
              <h1 className="display h1" style={{ marginTop: 18 }}>{company.tagline}</h1>
              <p className="lead">Producent budynków modułowych — domy, przedszkola, salony samochodowe, biura i gastronomia z kontenerów. Zaprojektuj swój obiekt w interaktywnym konfiguratorze 3D.</p>
              <div className="hero-actions">
                <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 19, height: 19 }} /> Zaprojektuj w 3D</Link>
                <Link to="/oferta" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.32)' }}>Zobacz ofertę <Arrow style={{ width: 17, height: 17 }} /></Link>
              </div>
              <div className="hero-badges">
                {heroBadges.map((b) => (
                  <span className="hero-badge" key={b}><span className="dot" /> {b}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
        <div className="scroll-cue"><div className="mouse" /><span>Przewiń</span></div>
      </section>

      {/* ---------- CONFIGURATOR CTA ---------- */}
      <section className="section cfg-showcase">
        <div className="cfg-showcase-glow" />
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <span className="eyebrow">Konfigurator 3D</span>
            <h2 className="h2 balance" style={{ marginTop: 16, color: '#fff' }}>Zaprojektuj swój obiekt, moduł po module.</h2>
            <p className="lead" style={{ marginTop: 20, color: 'var(--on-dark-soft)', marginInline: 'auto', maxWidth: '56ch' }}>
              Złóż budynek z gotowych modułów kontenerowych — dobierz układ, elewację i dach, obejrzyj bryłę w 3D, a gotowy projekt wyślij do nas po bezpłatną wycenę.
            </p>
            <div className="cfg-cta-points">
              {['Kilkanaście wariantów modułów', 'Podgląd 3D na żywo', 'Wycena bez zobowiązań'].map((t) => (
                <span className="hero-badge" key={t} style={{ color: 'var(--on-dark-soft)' }}><span className="dot" /> {t}</span>
              ))}
            </div>
            <div style={{ marginTop: 36 }}>
              <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 19, height: 19 }} /> Otwórz konfigurator 3D</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="section-sm">
        <div className="container">
          <Reveal className="stats">
            <Stat value={<>27<em>+</em></>} label="Zrealizowanych obiektów" />
            <Stat value={<>50<em>%</em></>} label="Krótszy czas realizacji" />
            <Stat value={<>24<em>h</em></>} label="Reakcja serwisu" />
            <Stat value={<>2<em> tyg.</em></>} label="Realizacja prostych obiektów" />
          </Reveal>
        </div>
      </section>

      {/* ---------- OFFER ---------- */}
      <section className="section soft">
        <div className="container">
          <SectionHead eyebrow="Oferta" title="Co budujemy z modułów" lead="Jedna technologia, wiele zastosowań — od domów i przedszkoli, przez salony samochodowe, po biura, hotele i gastronomię." />
          <div className="grid cols-3">
            {offer.slice(0, 6).map((o, i) => <OfferCard key={o.slug} item={o} delay={i * 60} />)}
          </div>
          <Reveal style={{ marginTop: 34, textAlign: 'center' }}>
            <Link to="/oferta" className="btn btn-dark btn-lg">Cała oferta <Arrow style={{ width: 17, height: 17 }} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- PROCESS ---------- */}
      <section className="section">
        <div className="container">
          <SectionHead center eyebrow="Jak pracujemy" title="Twój obiekt w pięciu krokach" lead="Przeprowadzimy Cię przez cały proces realizacji — od planu po transport obiektu na wskazane miejsce." />
          <div className="grid cols-3" style={{ gap: 18 }}>
            {processSteps.map((s, i) => (
              <Reveal key={s.title} delay={i * 60} className="step" style={{ gridTemplateColumns: 'auto 1fr' }}>
                <div className="step-num">{i + 1}</div>
                <div><h3>{s.title}</h3><p>{s.text}</p></div>
              </Reveal>
            ))}
            <Reveal delay={300} className="step" style={{ background: 'var(--bg-dark)', color: '#fff', gridTemplateColumns: '1fr', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff' }}>Gotowy, by zacząć?</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Otwórz konfigurator i zobacz swój obiekt w 3D.</p>
                <Link to="/konfigurator" className="btn btn-accent btn-sm" style={{ marginTop: 14 }}><Cube style={{ width: 15, height: 15 }} /> Konfigurator</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- REALIZACJE ---------- */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 18, marginBottom: 40 }}>
            <SectionHead eyebrow="Realizacje" title="O naszej jakości świadczą realizacje" />
            <Reveal><Link to="/realizacje" className="textlink" style={{ fontSize: '1rem' }}>Zobacz wszystkie <ArrowUpRight /></Link></Reveal>
          </div>
          <div className="bento">
            {realizacje.slice(0, 5).map((r, i) => (
              <Reveal key={r.title} delay={i * 50} className={i === 0 ? 'span-2 row-2' : ''}>
                <Link to="/realizacje" className={`tile ${i === 0 ? 'tall' : ''}`} style={{ minHeight: i === 0 ? '100%' : 290, height: '100%' }}>
                  <img src={r.img} alt={r.title} loading="lazy" />
                  <div className="tile-body">
                    <h3 style={{ fontSize: i === 0 ? '1.8rem' : '1.3rem' }}>{r.title}</h3>
                    <p>{r.place}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CLIENTS ---------- */}
      <section className="section-sm soft">
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="eyebrow neutral">Zaufali nam</span>
          </Reveal>
          <Reveal className="logos">
            {clients.map((c) => <img key={c} src={c} alt="" loading="lazy" />)}
          </Reveal>
        </div>
      </section>

      {/* ---------- VIDEO ---------- */}
      <section className="section dark">
        <div className="container">
          <SectionHead center eyebrow="JR w obiektywie" title="Zobacz nas w akcji" light />
          <Reveal>
            <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '16/9', background: '#000' }}>
              {playing ? (
                <video src={media.heroVideo} poster={media.poster} controls autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <button onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-label="Odtwórz wideo">
                  <img src={media.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)' }}>
                    <span style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                      <Play style={{ width: 40, height: 40 }} />
                    </span>
                  </span>
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ teaser ---------- */}
      <section className="section">
        <div className="container container-narrow">
          <SectionHead center eyebrow="FAQ" title="Masz pytania? Sprawdź odpowiedzi" />
          <div className="faq-list">
            {faq.slice(0, 4).map((f) => (
              <Reveal key={f.q} className="faq-item open">
                <div className="faq-q" style={{ cursor: 'default' }}>{f.q}</div>
                <div className="faq-a"><div className="faq-a-inner">{f.a}</div></div>
              </Reveal>
            ))}
          </div>
          <Reveal style={{ textAlign: 'center', marginTop: 30 }}>
            <Link to="/faq" className="btn btn-ghost btn-lg">Wszystkie pytania <Arrow style={{ width: 17, height: 17 }} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
