import { useRef } from 'react'
import { Drip } from '../components/Drip'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { MagneticButton } from '../components/MagneticButton'
import { SplitText } from '../components/SplitText'
import { asset, site } from '../data/site'

export function FinalCta() {
  const scoop = useRef<HTMLDivElement>(null)

  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    revealLines(q('.line-inner'), root, { stagger: 0.12 }, 'top 60%')
    if (reduced) return
    gsap.from(q('[data-cta-in]'), {
      autoAlpha: 0,
      y: 30,
      duration: 1.2,
      stagger: 0.1,
      scrollTrigger: { trigger: root, start: 'top 45%', once: true },
    })
    gsap.fromTo(
      scoop.current,
      { yPercent: 30, rotate: -14 },
      { yPercent: -20, rotate: 8, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
  })

  // 3D tilt of the floating cone towards the pointer
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !scoop.current) return
    const x = e.clientX / window.innerWidth - 0.5
    const y = e.clientY / window.innerHeight - 0.5
    gsap.to(scoop.current.firstElementChild, { rotateY: x * 24, rotateX: -y * 18, x: x * 30, duration: 1.4, ease: 'power3.out' })
  }

  return (
    <section
      ref={ref}
      id="cta"
      className="grain relative z-10 overflow-hidden bg-sun px-[var(--gutter)] py-[22vh] text-wine-deep"
      onPointerMove={onMove}
      aria-labelledby="cta-title"
    >
      <Drip color="var(--color-cream)" seed={11} />
      <div ref={scoop} className="pointer-events-none absolute top-[8%] right-[-6%] w-[min(52vw,560px)] [perspective:900px] max-md:top-auto max-md:right-[-18%] max-md:bottom-[-4%] max-md:w-[78vw]" aria-hidden="true">
        <img src={asset('images/products/uno.webp')} alt="" loading="lazy" decoding="async" className="w-full" />
      </div>
      <div className="relative">
        <p className="eyebrow mb-8" data-cta-in>
          {site.address.street} · {site.address.district}
        </p>
        <SplitText id="cta-title" text={'Prêt pour\nune *cuillère ?*'} className="display text-[clamp(4rem,13vw,14rem)]" />
        <div className="mt-14 flex flex-wrap items-center gap-6" data-cta-in>
          <MagneticButton href="#parfums" variant="wine" data-cursor="">
            Découvrir nos parfums
          </MagneticButton>
          <a className="ulink eyebrow pb-1" href={site.maps} target="_blank" rel="noopener">
            Nous trouver sur la carte ↗
          </a>
        </div>
      </div>
    </section>
  )
}
