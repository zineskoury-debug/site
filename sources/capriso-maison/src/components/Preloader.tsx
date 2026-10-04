import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../animations/motion'
import { asset } from '../data/site'

/**
 * Short, quiet loader: brand mark + percentage while fonts and the 3D scene load,
 * then a curtain that lifts on the hero.
 */
export function Preloader({ ready, onDone }: { ready: Promise<unknown>; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current!
    const reduced = prefersReducedMotion()
    const progress = { v: 0 }
    let finished = false
    const render = () => {
      count.current!.textContent = String(Math.round(progress.v)).padStart(2, '0')
      bar.current!.style.transform = `scaleX(${progress.v / 100})`
    }
    // creep towards 90 % while loading, then complete
    const creep = gsap.to(progress, { v: 90, duration: 2.4, ease: 'power2.out', onUpdate: render })
    const minTime = new Promise((r) => setTimeout(r, reduced ? 0 : 900))
    const failSafe = new Promise((r) => setTimeout(r, 6000))

    Promise.race([Promise.all([ready, minTime]), failSafe]).then(() => {
      if (finished) return
      finished = true
      creep.kill()
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.display = 'none'
        },
      })
      if (reduced) {
        tl.to(el, { autoAlpha: 0, duration: 0.3, onStart: onDone })
        return
      }
      tl.to(progress, { v: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: render })
        .to(el.querySelectorAll('[data-fade]'), { yPercent: -60, autoAlpha: 0, duration: 0.7, ease: 'power3.in', stagger: 0.05 })
        .add(onDone, '-=0.1')
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '<')
    })
    return () => {
      finished = true
      creep.kill()
    }
  }, [ready, onDone])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-cream text-ink"
      style={{ clipPath: 'inset(0 0 0 0)' }}
      aria-hidden="true"
    >
      <img data-fade src={asset('brand/logo-wine.webp')} alt="" width={520} height={184} className="w-[min(46vw,240px)]" />
      <div data-fade className="mt-10 flex w-[min(60vw,260px)] items-center gap-4">
        <span className="relative h-px flex-1 overflow-hidden bg-ink/15">
          <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-wine" />
        </span>
        <span className="eyebrow tabular-nums">
          <span ref={count}>00</span>
        </span>
      </div>
      <p data-fade className="eyebrow mt-6 text-muted !tracking-[0.3em]">
        Gelato artigianale
      </p>
    </div>
  )
}
