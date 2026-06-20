/* ============================================================
   Responsive-image generator (build step).

   Walks public/media/img, and for every raster source (.jpg/.jpeg/.png)
   emits down-scaled WebP variants alongside it, then writes a manifest
   (src/data/img-manifest.json) that <Picture> reads to build a srcset.

   • WebP only — the original JPEG/PNG stays as the universal <img> fallback.
   • Incremental: a variant is regenerated only when the source is newer.
   • EXIF orientation is baked in (.rotate) so WebP matches the auto-rotated
     JPEG the browser shows, and intrinsic w/h reflect the oriented size.

   Run via `npm run gen:images` (also runs automatically before each build).
   ============================================================ */
import sharp from 'sharp'
import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, extname, basename, join } from 'node:path'

const SRC_DIR = resolve('public/media/img')
const MANIFEST = resolve('src/data/img-manifest.json')
const PUBLIC_PREFIX = 'media/img' // how paths are referenced from the app (relative, matches IMG())
const WIDTHS = [400, 800, 1200, 1600] // candidate breakpoints; only those < the source width are made
const QUALITY = 80

const isRaster = (f) => /\.(jpe?g|png)$/i.test(f)
const mtime = (p) => (existsSync(p) ? statSync(p).mtimeMs : 0)

async function run() {
  const files = readdirSync(SRC_DIR).filter(isRaster).sort()
  const manifest = {}
  let made = 0, skipped = 0, failed = 0

  for (const file of files) {
    const srcPath = join(SRC_DIR, file)
    const base = basename(file, extname(file))
    try {
      const meta = await sharp(srcPath).metadata()
      // EXIF orientation 5–8 means the stored pixels are rotated 90°: swap dims.
      const oriented = meta.orientation && meta.orientation >= 5
      const W = oriented ? meta.height : meta.width
      const H = oriented ? meta.width : meta.height
      if (!W || !H) { failed++; continue }

      // Target widths: every breakpoint smaller than the source, plus the source
      // width itself (full-res WebP). Never upscale.
      const widths = [...new Set([...WIDTHS.filter((w) => w < W), W])].sort((a, b) => a - b)
      const variants = []
      for (const w of widths) {
        const outName = `${base}-${w}.webp`
        const outPath = join(SRC_DIR, outName)
        if (mtime(outPath) <= mtime(srcPath)) {
          await sharp(srcPath).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(outPath)
          made++
        } else {
          skipped++
        }
        // Height for this variant (keeps aspect; used only as metadata).
        variants.push({ u: `${PUBLIC_PREFIX}/${outName}`, w })
      }
      manifest[`${PUBLIC_PREFIX}/${file}`] = { w: W, h: H, variants }
    } catch (e) {
      failed++
      console.warn(`  ! skip ${file}: ${e.message}`)
    }
  }

  // Stable, sorted manifest so git diffs stay clean.
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n')

  console.log(`gen-images: ${files.length} sources → ${Object.keys(manifest).length} mapped · ${made} variants written, ${skipped} up-to-date${failed ? `, ${failed} failed` : ''}`)
}

run().catch((e) => { console.error(e); process.exit(1) })
