import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import Picture from '../components/Picture.jsx'
import { Mail, Arrow, Pin } from '../components/Icons.jsx'
import { realizacje, realizacjeNames } from '../data/content.js'

export default function Realizacje() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>Realizacje</span></div>
          <Reveal>
            <span className="eyebrow">Realizacje</span>
            <h1 className="display h1" style={{ marginTop: 16, maxWidth: '18ch' }}>O naszej jakości świadczą realizacje</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '60ch' }}>
              Prefabrykujemy obiekty w zamkniętej hali produkcyjnej, następnie gotowe realizacje transportujemy w całości lub modułach na cały świat. Zainteresowała Cię konkretna realizacja? Zapytaj o cenę.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="realizacje-grid">
            {realizacje.map((r) => (
              <Reveal key={r.title} className="real-item">
                <Picture src={r.img} alt={r.title} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                <div className="real-cap">
                  <b>{r.title}</b>
                  <span><Pin style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />{r.place}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm soft">
        <div className="container">
          <Reveal><h2 className="h3" style={{ marginBottom: 22 }}>Wybrane realizacje</h2></Reveal>
          <Reveal className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
            {realizacjeNames.map((n) => (
              <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 14px', background: 'var(--bg-soft)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-2)', fontSize: '0.92rem', color: 'var(--ink-2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />{n}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 className="h2 balance">Zastanawiasz się nad obiektem dla Twojego biznesu?</h2>
            <p className="lead" style={{ marginTop: 16 }}>Napisz do nas — poznamy Twoje wymagania i przygotujemy bezpłatną wycenę.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
              <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 18, height: 18 }} /> Zamów wycenę</Link>
              <Link to="/oferta" className="btn btn-ghost btn-lg">Zobacz ofertę <Arrow style={{ width: 17, height: 17 }} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
