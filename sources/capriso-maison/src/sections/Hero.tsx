import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, scrollToTarget, useGsap } from '../animations/motion'
import { emit, on, stage } from '../3d/stage'
import { burst } from '../components/Sprinkles'
import { flavors } from '../data/flavors'
import { asset, site } from '../data/site'

const Letters = ({ text }: { text: string }) => (
  <>
    {Array.from(text).map((c, i) => (
      <span key={i} className="char hero-char">
        {c}
      </span>
    ))}
  </>
)

/** Current hero flavour, rolling in each time the gelato is clicked. */
function FlavorLabel({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(stage.heroFlavor)
  useEffect(() => on('flavor', () => setIndex(stage.heroFlavor)), [])
  const f = flavors[index]
  return (
    <div className={className} aria-live="polite">
      <p className="eyebrow text-muted">
        Parfum <span className="tabular-nums">N°{String(index + 1).padStart(2, '0')}</span>
      </p>
      <p className="lede mt-1 overflow-hidden text-[1.5rem] md:text-[1.9rem]">
        <em key={f.id} className="block animate-[rollin_.8s_var(--ease-out-expo)_both]" style={{ color: f.ink }}>
          {f.italian}
        </em>
      </p>
    </div>
  )
}

export function Hero({ ready, webgl }: { ready: boolean; webgl: boolean }) {
  const intro = useRef<gsap.core.Timeline | null>(null)

  const ref = useGsap<HTMLElement>(({ root, reduced, q }) => {
    // scroll: the product moves / turns / zooms, the letters drift apart one by one
    gsap.to(stage, {
      hero: 1,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    })
    if (!reduced) {
      const st = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 }
      q('[data-hero-top] .hero-char').forEach((c, i) => {
        gsap.to(c, { yPercent: -40 - i * 22, rotate: (i - 2) * 5, ease: 'none', scrollTrigger: st })
      })
      const bottom = q('[data-hero-bottom] .hero-char')
      bottom.forEach((c, i) => {
        const mid = (bottom.length - 1) / 2
        gsap.to(c, { xPercent: (i - mid) * 18, yPercent: (i % 2 ? -1 : 1) * 30, rotate: (i - mid) * 3, ease: 'none', scrollTrigger: st })
      })
      gsap.to(q('[data-hero-fade]'), {
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: '40% top', scrub: true },
      })
    }

    // entrance, played when the preloader lifts
    const tl = gsap.timeline({ paused: true })
    if (reduced) {
      tl.set(stage, { intro: 1 })
    } else {
      gsap.set(q('.hero-char'), { yPercent: 120, rotateX: -95, transformPerspective: 800, transformOrigin: '50% 100%' })
      gsap.set(q('[data-hero-in]'), { autoAlpha: 0, y: 20 })
      tl.to(q('[data-hero-top] .hero-char'), { yPercent: 0, rotateX: 0, duration: 1.7, stagger: 0.07, ease: 'expo.out' }, 0.15)
        .to(q('[data-hero-bottom] .hero-char'), { yPercent: 0, rotateX: 0, duration: 1.7, stagger: 0.045, ease: 'expo.out' }, 0.35)
        .to(stage, { intro: 1, duration: 2.4, ease: 'power3.out' }, 0)
        .to(q('[data-hero-in]'), { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.8)
    }
    intro.current = tl
  })

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  // click / tap the gelato: new flavour + a burst of sprinkles in its colours
  const poke = (x: number, y: number) => {
    emit('poke')
    const next = flavors[(stage.heroFlavor + 1) % flavors.length]
    burst({ x, y, count: 46, power: 1.25, colors: [next.gelato.base, next.gelato.speck ?? next.ink, next.tint, '#a72438', '#fbf8f2'] })
  }

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex h-[100svh] min-h-[600px] flex-col justify-between overflow-hidden px-[var(--gutter)] pt-[calc(var(--nav-h)+1rem)] pb-8"
      aria-labelledby="hero-title"
    >
      {!webgl && (
        <img
          src={asset('images/hero.webp')}
          alt=""
          className="pointer-events-none absolute top-1/2 left-1/2 h-[66vh] w-auto -translate-x-1/2 -translate-y-[40%] object-contain"
        />
      )}

      <div className="relative z-10 flex items-start justify-between" data-hero-fade>
        <p className="eyebrow text-muted" data-hero-in>
          Gelateria artigianale
          <br />
          {site.city}
        </p>
        <p className="eyebrow hidden text-right text-muted md:block" data-hero-in>
          N°37 · Bachkou
          <br />
          Passione per il gelato
        </p>
        <div data-hero-in className="text-right md:hidden">
          <FlavorLabel />
          <p className="eyebrow mt-2 !text-[0.6rem] text-muted">↻ Touchez la glace</p>
        </div>
      </div>

      <h1
        id="hero-title"
        className="display pointer-events-none absolute inset-x-[var(--gutter)] top-[calc(var(--nav-h)+9svh)] bottom-[15svh] flex flex-col justify-between text-ink md:top-[calc(var(--nav-h)+4svh)] md:bottom-[13svh]"
        aria-label="Glace artisanale"
      >
        <span data-hero-top className="block text-[clamp(5.2rem,20vw,21rem)] whitespace-nowrap" aria-hidden="true">
          <Letters text="Glace" />
        </span>
        <span data-hero-bottom className="block text-right text-[clamp(3.6rem,15.5vw,17rem)] whitespace-nowrap" aria-hidden="true">
          <em>
            <Letters text="artisanale" />
          </em>
        </span>
      </h1>

      {/* hit zone over the 3D gelato */}
      {webgl && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Changer le parfum de la glace"
          data-cursor="Goûter"
          data-no-sprinkle
          className="absolute top-[54%] left-1/2 z-10 h-[52svh] w-[min(62vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          onClick={(e) => poke(e.clientX, e.clientY)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            const r = e.currentTarget.getBoundingClientRect()
            poke(r.left + r.width / 2, r.top + r.height / 2)
          }}
        />
      )}

      <div data-hero-fade className="pointer-events-none absolute top-[48%] left-[var(--gutter)] z-10 hidden md:block">
        <div data-hero-in>
          <FlavorLabel />
          <p className="eyebrow mt-4 flex items-center gap-2 text-ink">
            <span className={prefersReducedMotion() ? '' : 'inline-block animate-[spin_6s_linear_infinite]'}>↻</span>
            Cliquez sur la glace
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-6" data-hero-fade>
        <p className="lede max-w-[15rem] text-[1.05rem] text-ink md:text-[1.25rem]" data-hero-in>
          Fabriquée lentement.
          <br />
          <em>Dégustée instantanément.</em>
        </p>
        <a
          href="#maison"
          onClick={(e) => {
            e.preventDefault()
            scrollToTarget('#maison')
          }}
          className="group eyebrow flex items-center gap-3 text-ink"
          data-hero-in
          data-cursor="Découvrir"
        >
          <span className="relative block h-10 w-px overflow-hidden bg-ink/15">
            <span className={`absolute inset-x-0 top-0 h-1/2 bg-wine ${prefersReducedMotion() ? '' : 'animate-[scrollcue_2.2s_ease-in-out_infinite]'}`} />
          </span>
          Scroll to discover ↓
        </a>
      </div>
    </section>
  )
}
