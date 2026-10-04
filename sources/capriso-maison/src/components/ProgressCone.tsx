import { useEffect, useRef } from 'react'
import { ScrollTrigger, gsap, scrollToTarget } from '../animations/motion'

/**
 * Reading progress as a little cone that fills with gelato while you scroll.
 * Click it to go back to the top.
 */
export function ProgressCone() {
  const root = useRef<HTMLAnchorElement>(null)
  const fill = useRef<SVGRectElement>(null)
  const pct = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current!
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const p = self.progress
        // the scoop area spans y = 2 → 34 in the SVG
        fill.current!.setAttribute('y', String(34 - p * 32))
        pct.current!.textContent = `${Math.round(p * 100)}%`
        el.classList.toggle('is-on', p > 0.04)
      },
    })
    return () => st.kill()
  }, [])

  return (
    <a
      ref={root}
      href="#top"
      onClick={(e) => {
        e.preventDefault()
        gsap.fromTo(root.current, { rotate: -18 }, { rotate: 0, duration: 1, ease: 'elastic.out(1, 0.35)' })
        scrollToTarget('#top')
      }}
      className="progress-cone group fixed bottom-4 left-4 z-40 flex items-end gap-2 text-ink md:bottom-7 md:left-7"
      aria-label="Revenir en haut de la page"
      data-cursor="Haut"
    >
      <svg viewBox="0 0 36 64" className="h-10 w-auto drop-shadow-sm transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:-rotate-6 md:h-14" aria-hidden="true">
        <defs>
          <clipPath id="cone-scoop">
            <circle cx="18" cy="18" r="16" />
          </clipPath>
        </defs>
        <path d="M5 30 18 62 31 30Z" fill="#d6a05c" stroke="#7a4b1e" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M9 36l14 14M14 33l12 12M8 41l10 10M27 36 13 50M22 33 10 45M28 41 18 51" stroke="#7a4b1e" strokeWidth="0.9" opacity=".55" />
        <circle cx="18" cy="18" r="16" fill="var(--color-ivory)" stroke="currentColor" strokeWidth="1.2" />
        <g clipPath="url(#cone-scoop)">
          <rect ref={fill} x="0" y="34" width="36" height="40" fill="var(--color-wine)" />
        </g>
        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span ref={pct} className="eyebrow mb-1 !text-[0.6rem] tabular-nums opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        0%
      </span>
    </a>
  )
}
