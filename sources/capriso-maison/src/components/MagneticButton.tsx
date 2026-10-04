import { useEffect, useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { gsap, prefersReducedMotion, scrollToTarget } from '../animations/motion'

type Variant = 'ink' | 'wine' | 'outline' | 'light'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
  variant?: Variant
  /** Magnet strength in px. */
  strength?: number
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  ink: 'bg-ink text-ivory [--fill:var(--color-wine)] [--fill-ink:var(--color-ivory)]',
  wine: 'bg-wine text-ivory [--fill:var(--color-ink)] [--fill-ink:var(--color-ivory)]',
  outline: 'text-current ring-1 ring-current/40 ring-inset [--fill:var(--color-ink)] [--fill-ink:var(--color-ivory)]',
  light: 'bg-ivory text-ink [--fill:var(--color-wine)] [--fill-ink:var(--color-ivory)]',
}

/**
 * Pill link with a filling background, rolling label and a subtle magnetic pull.
 * In-page anchors scroll smoothly.
 */
export function MagneticButton({ children, variant = 'ink', strength = 14, icon, className = '', href, onClick, ...rest }: Props) {
  const el = useRef<HTMLAnchorElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const a = el.current
    const i = inner.current
    if (!a || !i || prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return
    const xa = gsap.quickTo(a, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    const ya = gsap.quickTo(a, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    const xi = gsap.quickTo(i, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    const yi = gsap.quickTo(i, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    const move = (e: PointerEvent) => {
      const r = a.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height
      xa(dx * strength)
      ya(dy * strength)
      xi(dx * strength * 0.5)
      yi(dy * strength * 0.5)
    }
    const leave = () => {
      xa(0)
      ya(0)
      xi(0)
      yi(0)
    }
    a.addEventListener('pointermove', move)
    a.addEventListener('pointerleave', leave)
    return () => {
      a.removeEventListener('pointermove', move)
      a.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  return (
    <a
      ref={el}
      href={href}
      onPointerDown={(e) => {
        // ripple from the exact click point + a little elastic squish
        const a = el.current
        if (!a || prefersReducedMotion()) return
        const r = a.getBoundingClientRect()
        const dot = document.createElement('span')
        dot.className = 'btn__ripple'
        dot.style.left = `${e.clientX - r.left}px`
        dot.style.top = `${e.clientY - r.top}px`
        a.appendChild(dot)
        gsap.fromTo(dot, { scale: 0, opacity: 0.55 }, { scale: (r.width / 10) * 1.2, opacity: 0, duration: 0.9, ease: 'power2.out', onComplete: () => dot.remove() })
        gsap.fromTo(a, { scale: 0.93 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
      }}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && href?.startsWith('#')) {
          e.preventDefault()
          scrollToTarget(href)
        }
      }}
      className={`btn group relative isolate inline-flex h-14 items-center overflow-hidden rounded-full px-7 text-[0.78rem] font-semibold tracking-[0.16em] uppercase ${variants[variant]} ${className}`}
      {...rest}
    >
      <span className="btn__fill absolute inset-0 -z-10 rounded-full bg-[var(--fill)]" aria-hidden="true" />
      <span ref={inner} className="relative flex items-center gap-3 transition-colors duration-500 group-hover:text-[var(--fill-ink)]">
        <span className="btn__roll relative block overflow-hidden">
          <span className="btn__label block">{children}</span>
          <span className="btn__label absolute top-full left-0 block" aria-hidden="true">
            {children}
          </span>
        </span>
        {icon ?? (
          <svg className="btn__icon h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        )}
      </span>
    </a>
  )
}
