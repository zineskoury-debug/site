import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, scrollToTarget, useGsap } from '../animations/motion'
import { stage } from '../3d/stage'
import { asset, site } from '../data/site'

export function Hero({ ready, webgl }: { ready: boolean; webgl: boolean }) {
  const intro = useRef<gsap.core.Timeline | null>(null)

  const ref = useGsap<HTMLElement>(({ root, reduced, q }) => {
    // scroll: the product moves / turns / zooms, the words drift apart
    gsap.to(stage, {
      hero: 1,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    })
    if (!reduced) {
      gsap.to(q('[data-hero-top]'), {
        yPercent: -35,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to(q('[data-hero-bottom]'), {
        xPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
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
      gsap.set(q('.line-inner'), { yPercent: 115 })
      gsap.set(q('[data-hero-in]'), { autoAlpha: 0, y: 20 })
      tl.to(q('.line-inner'), { yPercent: 0, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0.15)
        .to(stage, { intro: 1, duration: 2.4, ease: 'power3.out' }, 0)
        .to(q('[data-hero-in]'), { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.7)
    }
    intro.current = tl
  })

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

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

      <div className="flex items-start justify-between" data-hero-fade>
        <p className="eyebrow text-muted" data-hero-in>
          Gelateria artigianale
          <br />
          {site.city}
        </p>
        <p className="eyebrow hidden text-right text-muted sm:block" data-hero-in>
          N°37 · Bachkou
          <br />
          Passione per il gelato
        </p>
      </div>

      <h1
        id="hero-title"
        className="display pointer-events-none absolute inset-x-[var(--gutter)] top-[calc(var(--nav-h)+9svh)] bottom-[15svh] flex flex-col justify-between text-ink md:top-[calc(var(--nav-h)+4svh)] md:bottom-[13svh]"
        aria-label="Glace artisanale"
      >
        <span data-hero-top className="line-mask block text-[clamp(5.2rem,20vw,21rem)]" aria-hidden="true">
          <span className="line-inner">Glace</span>
        </span>
        <span
          data-hero-bottom
          className="line-mask block text-right text-[clamp(3.6rem,15.5vw,17rem)]"
          aria-hidden="true"
        >
          <span className="line-inner">
            <em>artisanale</em>
          </span>
        </span>
      </h1>

      <div className="flex items-end justify-between gap-6" data-hero-fade>
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
