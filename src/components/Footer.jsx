import { Link } from 'react-router-dom'
import Picture from './Picture.jsx'
import { company, offer } from '../data/content.js'
import { Mail, Phone, Pin, IgIcon, InIcon, YtIcon, Arrow } from './Icons.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* CTA strip */}
        <div className="cta-band" style={{ marginBottom: 64 }}>
          <div className="glow" />
          <div style={{ position: 'relative', maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: 'var(--accent-2)' }}>Zacznijmy od rozmowy</span>
            <h2 className="h2" style={{ color: '#fff', marginTop: 14 }}>Porozmawiajmy o Twoim obiekcie — resztę poprowadzimy my.</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: '1.05rem' }}>
              Opisz nam swój pomysł, a przygotujemy bezpłatną, niezobowiązującą wycenę. Krótkie doradztwo do 15 minut w zakresie projektowania i realizacji.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
              <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 18, height: 18 }} /> Zamów bezpłatną wycenę</Link>
              <Link to="/kontakt" className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Napisz do nas <Arrow style={{ width: 16, height: 16 }} /></Link>
            </div>
          </div>
        </div>

        <div className="footer-top">
          <div className="footer-brand">
            <Picture src={company.logo} alt="JR Modular Systems" sizes="220px" />
            <p>{company.intro}</p>
            <div className="footer-social">
              <a href={company.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IgIcon style={{ width: 18, height: 18 }} /></a>
              <a href={company.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><InIcon style={{ width: 18, height: 18 }} /></a>
              <a href={company.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><YtIcon style={{ width: 18, height: 18 }} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Oferta</h3>
            {offer.slice(0, 6).map((o) => (
              <Link key={o.slug} to={`/oferta/${o.slug}`}>{o.title}</Link>
            ))}
          </div>

          <div className="footer-col">
            <h3>Firma</h3>
            <Link to="/o-nas">O nas</Link>
            <Link to="/technologia">Technologia</Link>
            <Link to="/realizacje">Realizacje</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/kontakt">Kontakt</Link>
          </div>

          <div className="footer-col">
            <h3>Kontakt</h3>
            <a href={`mailto:${company.email}`}><Mail style={{ width: 16, height: 16 }} /> {company.email}</a>
            <a href={`tel:${company.phoneHref}`}><Phone style={{ width: 16, height: 16 }} /> {company.phone}</a>
            <a href="https://www.google.com/maps/place/JR+Modular+Systems" target="_blank" rel="noreferrer"><Pin style={{ width: 16, height: 16 }} /> {company.address}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {company.legalName} · NIP {company.nip}</span>
          <span style={{ display: 'flex', gap: 18 }}>
            <Link to="/kontakt">Polityka prywatności</Link>
            <span>{company.hashtag}</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
