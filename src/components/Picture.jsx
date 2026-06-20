import manifest from '../data/img-manifest.json'

/* Drop-in <img> replacement that serves WebP (with a width-based srcset) and
   keeps the original JPEG/PNG as the universal fallback. The build step
   (scripts/gen-images.mjs) produces the variants and the manifest this reads.

   • Any src not in the manifest (data: URLs from the configurator, .svg, remote)
     renders as a plain <img> — safe no-op.
   • Intrinsic width/height are emitted to reserve space (less layout shift).
   • The <picture> wrapper is display:contents (see index.css) so the inner
     <img> lays out exactly as before — existing `.x img` CSS is untouched.

   `sizes` should describe the image's rendered width so the browser can pick the
   smallest sufficient variant; it defaults to 100vw (full-bleed). */
export default function Picture({
  src,
  alt = '',
  sizes = '100vw',
  className,
  style,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority,
  width,
  height,
  ...rest
}) {
  const entry = src ? manifest[src] : null

  if (!entry || !entry.variants || entry.variants.length === 0) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        decoding={decoding}
        fetchpriority={fetchpriority}
        width={width}
        height={height}
        {...rest}
      />
    )
  }

  const srcSet = entry.variants.map((v) => `${v.u} ${v.w}w`).join(', ')

  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        width={width ?? entry.w}
        height={height ?? entry.h}
        loading={loading}
        decoding={decoding}
        fetchpriority={fetchpriority}
        {...rest}
      />
    </picture>
  )
}
