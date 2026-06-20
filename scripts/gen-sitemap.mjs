/* Generate public/sitemap.xml from the canonical route list in src/lib/seo.js,
   so the sitemap can never drift from the routes/offer catalog. Runs in every
   prebuild hook. Minimal modern sitemap (just <loc> — Google ignores priority/
   changefreq and treats unreliable lastmod with suspicion). */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTES, abs } from '../src/lib/seo.js'

const urls = ROUTES.map((r) => `  <url><loc>${abs(r)}</loc></url>`).join('\n')
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
writeFileSync(resolve('public/sitemap.xml'), xml)
console.log(`gen-sitemap: ${ROUTES.length} URLs → public/sitemap.xml`)
