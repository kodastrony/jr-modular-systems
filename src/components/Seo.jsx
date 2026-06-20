import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeo, SITE_NAME, LOCALE } from '../lib/seo.js'

/* Runtime <head> manager (React 18, no dependency). One instance lives in App and
   reacts to route changes, upserting title / description / canonical / robots /
   Open Graph / Twitter and swapping per-page JSON-LD. Upserts by selector so it
   updates the tags already present in index.html instead of duplicating them.
   Works under both BrowserRouter and HashRouter (useLocation gives the route path),
   and the prerender step snapshots the result after this effect runs. */

function upsertMeta(attr, key, content) {
  if (content == null) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const s = getSeo(pathname)

    document.title = s.title
    upsertMeta('name', 'description', s.description)
    upsertLink('canonical', s.canonical)
    upsertMeta(
      'name',
      'robots',
      s.noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    )
    document.documentElement.lang = 'pl'

    // Open Graph
    upsertMeta('property', 'og:title', s.title)
    upsertMeta('property', 'og:description', s.description)
    upsertMeta('property', 'og:url', s.canonical)
    upsertMeta('property', 'og:type', s.ogType || 'website')
    upsertMeta('property', 'og:image', s.ogImage)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', LOCALE)

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', s.title)
    upsertMeta('name', 'twitter:description', s.description)
    upsertMeta('name', 'twitter:image', s.ogImage)

    // Per-page JSON-LD (breadcrumb, service) — replace on each route change.
    document.head.querySelectorAll('script[data-seo-ld]').forEach((n) => n.remove())
    for (const obj of s.jsonLd || []) {
      const sc = document.createElement('script')
      sc.type = 'application/ld+json'
      sc.setAttribute('data-seo-ld', '1')
      sc.textContent = JSON.stringify(obj)
      document.head.appendChild(sc)
    }
  }, [pathname])

  return null
}
