import { useEffect, useRef, useState } from 'react'

/* Scroll-reveal wrapper using IntersectionObserver.
   `variant` selects the entrance motion: 'up' (default) | 'scale' | 'left' | 'right'. */
export default function Reveal({ children, as: Tag = 'div', delay = 0, variant, className = '', ...props }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setShown(true); io.unobserve(e.target) }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag
      ref={ref}
      data-reveal={variant || undefined}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(props.style || {}) }}
      {...props}
    >
      {children}
    </Tag>
  )
}
