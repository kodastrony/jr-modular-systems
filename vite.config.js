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
export default defineConfig(({ mode }) => {
  const singlefile = mode !== 'web'
  return {
    base: './',
    plugins: [
      react(),
      ...(singlefile ? [viteSingleFile(), fileProtocolFriendly()] : []),
      devShot(),
    ],
    server: { port: 5173, host: true },
    build: { chunkSizeWarningLimit: 4000 },
  }
})
