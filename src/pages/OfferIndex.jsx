import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { OfferCard, SectionHead } from '../components/UI.jsx'
import { Cube, Arrow } from '../components/Icons.jsx'
import { offer } from '../data/content.js'

export default function OfferIndex() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link to="/">Start</Link><span className="sep">/</span><span>Oferta</span></div>
          <Reveal>
            <span className="eyebrow">Oferta kontenerów modułowych</span>
            <h1 className="display h1" style={{ marginTop: 16, maxWidth: '16ch' }}>Budynki modułowe na każdą potrzebę</h1>
            <p className="lead" style={{ marginTop: 20, maxWidth: '60ch' }}>
              Jako producent budynków modułowych obsługujemy Klientów z najróżniejszych branż. Domy i przedszkola, salony samochodowe, biura, hotele, gastronomia, handel, serwerownie i pawilony eventowe — wszystko w autorskiej, systemowej technologii prefabrykacji.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="grid cols-3">
            {offer.map((o, i) => <OfferCard key={o.slug} item={o} delay={i * 50} />)}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container container-narrow" style={{ textAlign: 'center' }}>
          <SectionHead center eyebrow="Na czym polega budownictwo modułowe?" title="Szybciej, taniej i z pełną kontrolą jakości" lead="Większość procesu realizacji odbywa się w kontrolowanych warunkach zamkniętej hali fabrycznej. Wykonanie obiektu w technologii prefabrykowanej trwa o wiele krócej niż w tradycyjnych metodach budowlanych — a obiekt łatwo rozbudować, dodając kolejne moduły." />
          <Reveal style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/konfigurator" className="btn btn-accent btn-lg"><Cube style={{ width: 18, height: 18 }} /> Zaprojektuj w 3D</Link>
            <Link to="/technologia" className="btn btn-ghost btn-lg">Poznaj technologię <Arrow style={{ width: 17, height: 17 }} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
