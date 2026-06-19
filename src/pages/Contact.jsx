import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { Mail, Phone, Pin, Check, Cube } from '../components/Icons.jsx'
import { company } from '../data/content.js'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [project, setProject] = useState(null)
  const [form, setForm] = useState({ email: '', phone: '', message: '', consent: false })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Pick up a project handed off from the 3D configurator (if any) and pre-fill the message.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('jr-cfg-handoff')
      if (!raw) return
      const data = JSON.parse(raw)
      setProject(data)
      setForm((f) => (f.message ? f : { ...f, message: `Dzień dobry,\n\nproszę o wycenę projektu z konfiguratora 3D:\n\n${data.summary}\n\n` }))
    } catch { /* ignore */ }
  }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!form.consent) return
    // No backend in this build — open the user's mail client as a graceful fallback.
    const projLines = project ? `\n\n— Projekt z konfiguratora 3D —\n${project.summary}` : ''
    const body = encodeURIComponent(`Telefon: ${form.phone}\n\n${form.message}${projLines}`)
    const subject = (project ? 'Wycena projektu 3D — ' : 'Zapytanie ze strony — ') + (form.email || '')
    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${body}`
    setSent(true)
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>Kontakt</span></div>
          <Reveal>
            <span className="eyebrow">Kontakt</span>
            <h1 className="display h1" style={{ marginTop: 16 }}>Skontaktuj się z nami</h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: '52ch' }}>Zostaw kontakt, a resztę rozmowy poprowadzimy my. Krótkie doradztwo do 15 minut w zakresie projektowania i realizacji budynku modułowego.</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 14 }}>
        <div className="container">
          <div className="contact-grid">
            {/* contacts */}
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {company.contacts.map((c) => (
                  <div className="contact-card" key={c.email}>
                    <span className="role">{c.role}</span>
                    <b>{c.name}</b>
                    <a href={`mailto:${c.email}`}><Mail style={{ width: 16, height: 16 }} /> {c.email}</a>
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`}><Phone style={{ width: 16, height: 16 }} /> {c.phone}</a>
                  </div>
                ))}
                <div className="contact-card" style={{ background: 'var(--bg-dark)', color: '#fff', borderColor: 'var(--line)' }}>
                  <span className="role" style={{ color: 'var(--accent-2)' }}>Siedziba</span>
                  <b style={{ color: '#fff' }}>{company.legalName}</b>
                  <a href="https://www.google.com/maps/place/JR+Modular+Systems" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.85)' }}><Pin style={{ width: 16, height: 16 }} /> {company.address}</a>
                  <span style={{ color: 'var(--on-dark-faint)', fontSize: '0.82rem', marginTop: 8 }}>NIP {company.nip} · Główna siedziba: {company.hqCity}</span>
                </div>
              </div>
            </Reveal>

            {/* form (+ optional 3D project handed off from the configurator) */}
            <Reveal delay={80}>
              {project && (
                <div className="card" style={{ background: 'var(--bg-soft)', overflow: 'hidden', marginBottom: 16 }}>
                  {project.image && <img src={project.image} alt="Podgląd Twojego projektu z konfiguratora 3D" style={{ width: '100%', display: 'block', background: '#aeb6c0' }} />}
                  <div style={{ padding: '18px 22px' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Twój projekt z konfiguratora 3D</span>
                    <div style={{ marginTop: 12, display: 'grid', gap: 7 }}>
                      {project.summary.split('\n').map((line, i) => {
                        const idx = line.indexOf(':')
                        if (idx === -1) return <div key={i} style={{ fontSize: '0.9rem', color: 'var(--ink-2)' }}>{line}</div>
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: '0.9rem', borderBottom: '1px solid var(--line-2)', paddingBottom: 6 }}>
                            <span style={{ color: 'var(--muted)' }}>{line.slice(0, idx)}</span>
                            <span style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{line.slice(idx + 1).trim()}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="form-note" style={{ marginTop: 12 }}>Dołączyliśmy te dane do formularza — wyślij zapytanie, a przygotujemy bezpłatną wycenę.</p>
                  </div>
                </div>
              )}
              <div className="card" style={{ background: 'var(--bg-soft)', padding: 'clamp(24px, 4vw, 38px)' }}>
                <h2 className="h3" style={{ marginBottom: 6 }}>Formularz kontaktowy</h2>
                <p className="text-muted" style={{ marginBottom: 22 }}>Odpowiadamy na wszystkie zgłoszenia najpóźniej do 24 godzin.</p>
                {sent ? (
                  <div className="form-success" role="status" aria-live="polite">
                    <Check style={{ width: 20, height: 20, color: 'var(--accent)', display: 'inline', verticalAlign: '-4px', marginRight: 8 }} />
                    Dziękujemy! Otworzyliśmy Twój program pocztowy, by dokończyć wysyłkę. Jeśli to nie zadziałało, napisz na <a href={`mailto:${company.email}`} style={{ color: 'var(--accent)' }}>{company.email}</a>.
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <div className="field">
                      <label htmlFor="email">E-mail</label>
                      <input id="email" className="input" type="email" required value={form.email} onChange={set('email')} placeholder="twoj@email.pl" />
                    </div>
                    <div className="field">
                      <label htmlFor="phone">Telefon</label>
                      <input id="phone" className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+48 000 000 000" />
                    </div>
                    <div className="field">
                      <label htmlFor="msg">Wiadomość</label>
                      <textarea id="msg" className="textarea" value={form.message} onChange={set('message')} placeholder="Opisz swój obiekt — rodzaj, powierzchnia, lokalizacja…" />
                    </div>
                    <label className="checkbox-row" style={{ marginBottom: 18 }}>
                      <input type="checkbox" checked={form.consent} onChange={set('consent')} required />
                      <span>Wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi zapytania. Administratorem danych jest {company.legalName}, NIP {company.nip}, {company.address}.</span>
                    </label>
                    <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={!form.consent}>Wyślij zapytanie</button>
                  </form>
                )}
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>Wolisz zacząć od wizualizacji?</span>
                  <Link to="/konfigurator" className="btn btn-ghost btn-sm"><Cube style={{ width: 15, height: 15 }} /> Konfigurator 3D</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line-2)' }}>
            <iframe
              title="Mapa — JR Modular Systems"
              src="https://www.google.com/maps?q=JR%20Modular%20Systems&output=embed"
              style={{ width: '100%', height: 380, border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </section>
    </>
  )
}
