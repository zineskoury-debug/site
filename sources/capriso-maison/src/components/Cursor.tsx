import { useEffect, useRef } from 'react'
import { gsap } from '../animations/motion'

/**
 * Desktop-only cursor: a small dot and a ring that grows into a label
 * over elements carrying data-cursor="View" (or any word).
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const r = ring.current!
    const d = dot.current!
    const l = label.current!
    document.documentElement.classList.add('has-cursor')
    const xr = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3.out' })
    const yr = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3.out' })
    const xd = gsap.quickTo(d, 'x', { duration: 0.12, ease: 'power3.out' })
    const yd = gsap.quickTo(d, 'y', { duration: 0.12, ease: 'power3.out' })
    let shown = false
    let current: string | null = null

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!shown) {
        gsap.set([r, d], { x: e.clientX, y: e.clientY })
        gsap.to([r, d], { autoAlpha: 1, duration: 0.4 })
        shown = true
      }
      xr(e.clientX)
      yr(e.clientY)
      xd(e.clientX)
      yd(e.clientY)
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor], a, button, [role="button"]')
      const text = target?.dataset.cursor ?? (target ? '' : null)
      if (text === current) return
      current = text
      if (text) l.textContent = text
      r.classList.toggle('is-label', !!text)
      r.classList.toggle('is-link', text === '')
      d.classList.toggle('is-hidden', !!text)
    }
    const onLeave = () => {
      gsap.to([r, d], { autoAlpha: 0, duration: 0.3 })
      shown = false
    }
    const onDown = () => gsap.to(r, { scale: 0.85, duration: 0.2 })
    const onUp = () => gsap.to(r, { scale: 1, duration: 0.4 })
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div className="cursor pointer-events-none fixed inset-0 z-[90] text-ink mix-blend-normal" aria-hidden="true">
      <div
        ref={ring}
        className="cursor__ring invisible absolute top-0 left-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full opacity-0"
      >
        <span ref={label} className="cursor__label eyebrow !text-[0.62rem] !tracking-[0.18em] text-ivory" />
      </div>
      <div ref={dot} className="cursor__dot invisible absolute top-0 left-0 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine opacity-0" />
    </div>
  )
}
