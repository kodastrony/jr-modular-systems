import { useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import Picture from '../components/Picture.jsx'
import { SectionHead, Stat, OfferCard } from '../components/UI.jsx'
import { Mail, Arrow, ArrowUpRight, Play } from '../components/Icons.jsx'
import { company, heroBadges, offer, processSteps, realizacje, clients, faq, media } from '../data/content.js'

const mq = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches

/* Skip the video and show only the poster when motion is unwanted or the
   connection is metered/slow — so weak networks never pull megabytes of video. */
function preferStill() {
  if (mq('(prefers-reduced-motion: reduce)')) return true
  const c = typeof navigator !== 'undefined' && navigator.connection
  return !!(c && (c.saveData || /(^|[^0-9])2g$/.test(c.effectiveType || '')))
}

/* Hero background: a muted autoplay loop (plays on mobile via playsInline), with a
   lighter 540p source on small screens and a static poster as the fallback. The
   poster paints instantly under the video, so first paint is never blocked. */
function HeroMedia() {
  if (preferStill()) return <Picture src={media.poster} alt="" sizes="100vw" loading="eager" fetchpriority="high" />
  const src = (mq('(max-width: 760px)') && media.heroLoopMobile) || media.heroLoop
  return <video src={src} poster={media.poster} autoPlay muted loop playsInline preload="metadata" />
}

export default function Home() {
  const [playing, setPlaying] = useState(false)

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-media">
          <HeroMedia />
        </div>
        <div className="hero-inner">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow" style={{ color: 'var(--accent-2)' }}>{company.hashtag}</span>
              <h1 className="display h1" style={{ marginTop: 18 }}>{company.tagline}</h1>
              <p className="lead">Producent budynków modułowych — domy, przedszkola, salony samochodowe, biura i gastronomia z kontenerów. Napisz do nas i otrzymaj bezpłatną, niezobowiązującą wycenę.</p>
              <div className="hero-actions">
                <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 19, height: 19 }} /> Zamów bezpłatną wycenę</Link>
                <Link to="/oferta" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.32)' }}>Zobacz ofertę <Arrow style={{ width: 17, height: 17 }} /></Link>
              </div>
              <div className="hero-badges">
                {heroBadges.map((b) => (
                  <span className="hero-badge" key={b}><span className="dot" aria-hidden="true" /> {b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-cue"><div className="mouse" /><span>Przewiń</span></div>
      </section>

      {/* ---------- CONFIGURATOR CTA ---------- */}
      <section className="section cfg-showcase">
        <div className="cfg-showcase-glow" />
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <span className="eyebrow">Bezpłatna wycena</span>
            <h2 className="h2 balance" style={{ marginTop: 16 }}>Opowiedz nam o swoim obiekcie.</h2>
            <p className="lead" style={{ marginTop: 20, marginInline: 'auto', maxWidth: '56ch' }}>
              Napisz lub zadzwoń — wspólnie dobierzemy układ, elewację i dach, a Ty otrzymasz bezpłatną, niezobowiązującą wycenę oraz plan realizacji.
            </p>
            <div className="cfg-cta-points">
              {['Bezpłatna wycena', 'Odpowiedź do 24 h', 'Doradztwo i projekt'].map((t) => (
                <span className="hero-badge" key={t} style={{ color: 'var(--ink-2)' }}><span className="dot" aria-hidden="true" /> {t}</span>
              ))}
            </div>
            <div style={{ marginTop: 36 }}>
              <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 19, height: 19 }} /> Zamów bezpłatną wycenę</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="section-sm">
        <div className="container">
          <Reveal className="stats">
            <Stat to={27} suffix="+" label="Zrealizowanych obiektów" />
            <Stat to={50} suffix="%" label="Krótszy czas realizacji" />
            <Stat to={24} suffix="h" label="Reakcja serwisu" />
            <Stat to={2} suffix=" tyg." label="Realizacja prostych obiektów" />
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
            <Reveal delay={300} className="step" style={{ background: 'var(--accent)', borderColor: 'transparent', gridTemplateColumns: '1fr', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--accent-ink)' }}>Gotowy, by zacząć?</h3>
                <p style={{ color: 'rgba(26,21,5,0.74)' }}>Napisz do nas — przygotujemy bezpłatną, niezobowiązującą wycenę.</p>
                <Link to="/kontakt" className="btn btn-dark btn-sm" style={{ marginTop: 14 }}><Mail style={{ width: 15, height: 15 }} /> Skontaktuj się</Link>
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
                <Link to="/realizacje" className={`tile ${i === 0 ? 'tall' : ''}`} style={{ minHeight: i === 0 ? 380 : 290, height: '100%' }}>
                  <Picture src={r.img} alt={r.title} sizes="(max-width: 720px) 100vw, 50vw" />
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
            {clients.map((c) => <Picture key={c} src={c} alt="" sizes="160px" />)}
          </Reveal>
        </div>
      </section>

      {/* ---------- VIDEO ---------- */}
      <section className="section">
        <div className="container">
          <SectionHead center eyebrow="JR w obiektywie" title="Zobacz nas w akcji" />
          <Reveal>
            <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '16/9', background: '#000' }}>
              {playing ? (
                <video src={media.heroVideo} poster={media.poster} controls autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <button onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-label="Odtwórz wideo">
                  <Picture src={media.poster} alt="" sizes="(max-width: 1100px) 100vw, 1100px" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
