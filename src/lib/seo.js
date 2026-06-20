/* ============================================================
   SEO / GEO single source of truth.

   Pure data + builders (no React) so the same metadata feeds:
   • the <Seo> runtime head manager (src/components/Seo.jsx),
   • the prerender step (scripts/prerender.mjs),
   • the sitemap generator (scripts/gen-sitemap.mjs).

   Canonicals always point at the production domain so the GitHub-Pages
   mirror is de-duplicated to one indexable origin.
   ============================================================ */
import { company, offer, faq } from '../data/content.js'

export const SITE_URL = 'https://jr-modular-systems.kodastrony.pl'
export const SITE_NAME = 'JR Modular Systems'
export const LOCALE = 'pl_PL'

export const abs = (p = '/') => SITE_URL + (p.startsWith('/') ? p : '/' + p)
const clamp = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')

const DEFAULT_OG = abs('/media/img/biuro-2.jpg')

// "Świętej Elżbiety 6, 41-905 Bytom" → structured PostalAddress
const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Świętej Elżbiety 6',
  postalCode: '41-905',
  addressLocality: 'Bytom',
  addressRegion: 'śląskie',
  addressCountry: 'PL',
}

const ORG_ID = abs('/#organization')
const WEBSITE_ID = abs('/#website')

/* Site-wide entity — designer + manufacturer + installer of modular buildings.
   GeneralContractor is a LocalBusiness subtype, so this one node carries both the
   Organization and LocalBusiness signals. Only verified facts (NAP, socials). */
export const organizationLd = () => ({
  '@type': 'GeneralContractor',
  '@id': ORG_ID,
  name: SITE_NAME,
  legalName: company.legalName,
  url: SITE_URL,
  logo: abs('/media/img/JR-modular-LOGO-full.png'),
  image: DEFAULT_OG,
  description:
    'Producent budynków modułowych i kontenerowych — projektowanie, prefabrykacja w hali i montaż obiektów ze stali: biura, przedszkola, pawilony handlowe, gastronomia, hotele, pawilony eventowe i serwerownie.',
  telephone: company.phoneHref,
  email: company.email,
  vatID: 'PL' + company.nip,
  taxID: company.nip,
  address: ADDRESS,
  areaServed: { '@type': 'Country', name: 'Polska' },
  knowsLanguage: ['pl', 'en'],
  sameAs: [company.social.instagram, company.social.linkedin, company.social.youtube].filter(Boolean),
})

export const websiteLd = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: 'pl-PL',
  publisher: { '@id': ORG_ID },
})

/* The site-wide graph injected statically into index.html (indexable without JS). */
export const siteGraph = () => ({ '@context': 'https://schema.org', '@graph': [organizationLd(), websiteLd()] })

const breadcrumbLd = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.name,
    item: abs(t.path),
  })),
})

const serviceLd = (o) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: o.title,
  serviceType: o.title,
  description: clamp(o.lead || o.short, 300),
  provider: { '@id': ORG_ID },
  areaServed: { '@type': 'Country', name: 'Polska' },
  url: abs('/oferta/' + o.slug),
  image: abs('/' + o.hero),
})

/* FAQ as structured data. Google retired FAQ rich RESULTS (May 2026) but the
   FAQPage type stays valid and is one of the cleanest signals AI engines extract
   and cite — so we keep it for GEO, not for SERP visuals. */
const faqLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
})

/* Homepage catalog of building types — links the entity to its service range. */
const offerCatalogLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  name: 'Budynki modułowe — oferta JR Modular Systems',
  itemListElement: offer.map((o) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: o.title, url: abs('/oferta/' + o.slug) },
  })),
})

const HOME = { name: 'Start', path: '/' }

/* Per-route static metadata. Titles ≤ ~60, descriptions ~140–160. */
const STATIC = {
  '/': {
    title: 'Budynki modułowe i kontenerowe | JR Modular Systems',
    description:
      'Projektujemy i produkujemy budynki modułowe oraz kontenerowe — biura, gastronomia, hotele, przedszkola. Zaprojektuj swój obiekt w konfiguratorze 3D i zamów wycenę.',
    breadcrumb: [HOME],
  },
  '/oferta': {
    title: 'Oferta — budynki i kontenery modułowe | JR Modular',
    description:
      'Pełna oferta budynków modułowych: biura, przedszkola, pawilony handlowe, gastronomia, hotele, pawilony eventowe i serwerownie. Projekt, produkcja i montaż w całej Polsce.',
    breadcrumb: [HOME, { name: 'Oferta', path: '/oferta' }],
  },
  '/o-nas': {
    title: 'O nas — producent budynków modułowych | JR Modular',
    description:
      'Poznaj JR Modular Systems — projektujemy i produkujemy budynki modułowe ze stali. Własna hala produkcyjna, doświadczony zespół i indywidualne podejście do każdego obiektu.',
    breadcrumb: [HOME, { name: 'O nas', path: '/o-nas' }],
  },
  '/technologia': {
    title: 'Technologia modułowa — jak budujemy | JR Modular',
    description:
      'Technologia modułowa krok po kroku: prefabrykacja w hali, konstrukcja stalowa, izolacje i wykończenie. Buduj szybciej, taniej i z powtarzalną jakością niż metodą tradycyjną.',
    breadcrumb: [HOME, { name: 'Technologia', path: '/technologia' }],
  },
  '/realizacje': {
    title: 'Realizacje — nasze budynki modułowe | JR Modular',
    description:
      'Zobacz zrealizowane budynki modułowe i kontenerowe JR Modular Systems — biura, gastronomia, handel i obiekty użytkowe dostarczone w Polsce i za granicą.',
    breadcrumb: [HOME, { name: 'Realizacje', path: '/realizacje' }],
  },
  '/faq': {
    title: 'FAQ — budynki modułowe: pytania i odpowiedzi | JR',
    description:
      'Najczęstsze pytania o budynki i kontenery modułowe: czas realizacji, koszty, pozwolenia, trwałość, transport i możliwości rozbudowy. Sprawdź konkretne odpowiedzi.',
    breadcrumb: [HOME, { name: 'FAQ', path: '/faq' }],
  },
  '/kontenery-uzywane': {
    title: 'Kontenery używane — sprzedaż | JR Modular Systems',
    description:
      'Używane kontenery i moduły w dobrym stanie technicznym — ekonomiczna alternatywa na biuro, magazyn czy zaplecze budowy. Sprawdź dostępność i zapytaj o cenę.',
    breadcrumb: [HOME, { name: 'Kontenery używane', path: '/kontenery-uzywane' }],
  },
  '/kontakt': {
    title: 'Kontakt — wycena budynku modułowego | JR Modular',
    description:
      'Skontaktuj się z JR Modular Systems — Świętej Elżbiety 6, Bytom. Zamów bezpłatną wycenę budynku modułowego lub kontenerowego. Telefon +48 535 901 200.',
    breadcrumb: [HOME, { name: 'Kontakt', path: '/kontakt' }],
  },
  '/konfigurator': {
    title: 'Konfigurator 3D budynku modułowego | JR Modular',
    description:
      'Zaprojektuj swój budynek modułowy w interaktywnym konfiguratorze 3D — ułóż moduły, dobierz elewację i dach, a gotowy projekt wyślij do bezpłatnej wyceny.',
    breadcrumb: [HOME, { name: 'Konfigurator 3D', path: '/konfigurator' }],
  },
}

const offerBySlug = Object.fromEntries(offer.map((o) => [o.slug, o]))

/* Resolve full SEO payload for any pathname (incl. dynamic /oferta/:slug). */
export function getSeo(pathname) {
  const path = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  // /oferta/:slug
  const m = /^\/oferta\/([^/]+)$/.exec(path)
  if (m && offerBySlug[m[1]]) {
    const o = offerBySlug[m[1]]
    return {
      title: clamp(`${o.title} — JR Modular Systems`, 62),
      description: clamp(o.lead || o.short, 160),
      canonical: abs(path),
      ogImage: abs('/' + o.hero),
      ogType: 'article',
      jsonLd: [
        serviceLd(o),
        breadcrumbLd([HOME, { name: 'Oferta', path: '/oferta' }, { name: o.title, path }]),
      ],
    }
  }

  const s = STATIC[path]
  if (s) {
    const extra = []
    if (path === '/') extra.push(offerCatalogLd())
    if (path === '/faq') extra.push(faqLd())
    return {
      title: s.title,
      description: s.description,
      canonical: abs(path),
      ogImage: DEFAULT_OG,
      ogType: 'website',
      jsonLd: [breadcrumbLd(s.breadcrumb), ...extra],
    }
  }

  // Unknown route (404) — keep indexable signals minimal + noindex.
  return {
    title: 'Nie znaleziono strony | JR Modular Systems',
    description: 'Ta strona nie istnieje. Wróć na stronę główną JR Modular Systems lub przejdź do oferty budynków modułowych.',
    canonical: abs(path),
    ogImage: DEFAULT_OG,
    ogType: 'website',
    noindex: true,
    jsonLd: [],
  }
}

/* All indexable routes — consumed by the sitemap generator + prerender. */
export const ROUTES = [
  '/', '/oferta', '/o-nas', '/technologia', '/realizacje', '/faq',
  '/kontenery-uzywane', '/kontakt', '/konfigurator',
  ...offer.map((o) => '/oferta/' + o.slug),
]
