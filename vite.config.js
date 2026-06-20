import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// DEV-only: accept a posted data-URL at POST /__shot and write it to _shots/ on
// disk, so headless visual checks of the WebGL canvas (which screenshots can't
// capture here) can be Read back as image files. Never part of the prod build.
function devShot() {
  return {
    name: 'dev-shot',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try {
            const m = /^data:image\/(png|jpeg);base64,(.+)$/s.exec(body.trim())
            const ext = m ? (m[1] === 'jpeg' ? 'jpg' : 'png') : 'png'
            const data = m ? m[2] : body
            mkdirSync(resolve('_shots'), { recursive: true })
            writeFileSync(resolve(`_shots/shot.${ext}`), Buffer.from(data, 'base64'))
            res.statusCode = 200; res.end(`/_shots/shot.${ext}`)
          } catch (e) { res.statusCode = 500; res.end(String(e)) }
        })
      })
    },
  }
}

// Strip the `crossorigin` attribute from the inlined script/style so the single
// file runs cleanly when opened directly from disk (file://). Leaves the Google
// Fonts preconnect untouched.
function fileProtocolFriendly() {
  return {
    name: 'file-protocol-friendly',
    closeBundle() {
      const p = resolve('dist/index.html')
      let html = readFileSync(p, 'utf8')
      html = html
        .replace('<script type="module" crossorigin>', '<script type="module">')
        .replace(/<style([^>]*) crossorigin>/g, '<style$1>')
      writeFileSync(p, html)
    },
  }
}

// Two build shapes (base: './' keeps assets relative; HashRouter keeps the URL
// path at root, so relative asset URLs always resolve):
//   • default `vite build` → ONE inlined index.html that opens straight from disk
//     (file://) by double-click, no server needed. This is the everyday build.
//   • `vite build --mode web` → code-split. Content pages skip the heavy Three.js
//     bundle (the 3D configurator is a lazy chunk) — fast on weak devices, for
//     hosting on Cloudflare / GitHub Pages (where a server loads the chunks).
export default defineConfig(({ mode, command }) => {
  // Build shapes:
  //   • default `vite build` (production) → single inlined index.html, HashRouter,
  //     relative base. This is what Cloudflare's git build serves at
  //     jr-modular-systems.kodastrony.pl today (and opens from file://). It still
  //     carries all the SEO: site-wide JSON-LD in index.html + the runtime <Seo>
  //     head manager. Under HashRouter every clean URL renders Home and canonicals
  //     to "/", so Google consolidates to one richly-marked-up page (no dup harm).
  //   • `--mode hosted` → code-split, base '/', BrowserRouter (clean per-page URLs
  //     + SPA fallback). The full per-page-indexable SEO build — deploy to
  //     Cloudflare via `wrangler pages deploy` or by pointing CF's build command at
  //     `npm run build:hosted` once the git build is unblocked.
  //   • `--mode web` → code-split, relative base, HashRouter. GitHub-Pages mirror,
  //     de-duplicated to the root domain via cross-domain canonical.
  const dev = command === 'serve'
  const hosted = mode === 'hosted'
  const singlefile = command === 'build' && !hosted && mode !== 'web'
  const useHash = !(hosted || dev) // BrowserRouter (clean URLs) for hosted build + dev; HashRouter otherwise
  return {
    base: hosted || dev ? '/' : './',
    define: {
      __USE_HASH_ROUTER__: JSON.stringify(useHash),
    },
    plugins: [
      react(),
      ...(singlefile ? [viteSingleFile(), fileProtocolFriendly()] : []),
      devShot(),
    ],
    server: { port: 5173, host: true },
    build: { chunkSizeWarningLimit: 4000 },
  }
})
