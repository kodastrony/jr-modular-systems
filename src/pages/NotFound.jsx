import { Link } from 'react-router-dom'
import { Arrow, Mail } from '../components/Icons.jsx'

export default function NotFound() {
  return (
    <section className="section" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div className="container container-narrow">
        <span className="eyebrow">404</span>
        <h1 className="display h1" style={{ marginTop: 14 }}>Nie znaleziono strony</h1>
        <p className="lead" style={{ marginTop: 16 }}>Strona, której szukasz, mogła zostać przeniesiona. Wróć na start albo napisz do nas.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <Link to="/" className="btn btn-dark btn-lg">Strona główna <Arrow style={{ width: 17, height: 17 }} /></Link>
          <Link to="/kontakt" className="btn btn-accent btn-lg"><Mail style={{ width: 18, height: 18 }} /> Skontaktuj się</Link>
        </div>
      </div>
    </section>
  )
}
