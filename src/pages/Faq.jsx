import { useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { Mail, Arrow } from '../components/Icons.jsx'
import { faq } from '../data/content.js'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>FAQ</span></div>
          <Reveal>
            <span className="eyebrow">Pytania i odpowiedzi</span>
            <h1 className="display h1" style={{ marginTop: 16 }}>Sprawdź odpowiedzi!</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '54ch' }}>Masz pytania? Poznaj odpowiedzi na najpopularniejsze z nich, zanim przejdziesz do kolejnych kroków.</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container container-narrow">
          <div className="faq-list">
            {faq.map((f, i) => (
              <div key={f.q} className={`faq-item ${open === i ? 'open' : ''}`}>
                <button className="faq-q" id={`faq-q-${i}`} onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} aria-controls={`faq-a-${i}`}>
                  {f.q}
                  <span className="faq-icon" />
                </button>
                <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} style={{ maxHeight: open === i ? 800 : 0, transition: 'max-height 0.4s var(--ease)' }}>
                  <div className="faq-a-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>

          <Reveal style={{ marginTop: 50, textAlign: 'center' }}>
            <div className="cta-band" style={{ borderRadius: 'var(--r-xl)' }}>
              <div className="glow" />
              <div style={{ position: 'relative' }}>
                <h2 className="h3" style={{ color: '#fff' }}>Nie znalazłeś odpowiedzi?</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10 }}>Napisz lub zadzwoń — chętnie doradzimy i przygotujemy bezpłatną, niezobowiązującą wycenę.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
                  <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 18, height: 18 }} /> Zamów wycenę</Link>
                  <Link to="/kontakt" className="btn btn-light btn-lg">Napisz do nas <Arrow style={{ width: 17, height: 17 }} /></Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
