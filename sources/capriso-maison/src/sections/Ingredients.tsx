import { useEffect, useRef } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { stage } from '../3d/stage'
import { SplitText } from '../components/SplitText'

// Same order as the `label` indices in 3d/Ingredients.tsx
const INGREDIENTS = [
  { name: 'Pistache', note: 'torréfiée' },
  { name: 'Fraise', note: 'cueillie mûre' },
  { name: 'Citron', note: 'pressé minute' },
  { name: 'Vanille', note: 'en gousse' },
  { name: 'Chocolat', note: 'noir, 70 %' },
  { name: 'Noisette', note: 'grillée' },
  { name: 'Lait', note: 'entier' },
]

/** Captions that follow the floating 3D ingredients (desktop only). */
function FloatingLabels() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    const tick = () => {
      stage.labels.forEach((l, i) => {
        const el = refs.current[i]
        if (!el) return
        el.style.opacity = String(l.visible)
        el.style.transform = `translate3d(${l.x}px, ${l.y}px, 0)`
        // captions near the right edge flip to the left of their object
        el.classList.toggle('is-flipped', l.x > window.innerWidth * 0.8)
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] hidden md:block" aria-hidden="true">
      {INGREDIENTS.map((ing, i) => (
        <div
          key={ing.name}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="absolute top-0 left-0 opacity-0 will-change-transform"
        >
          <div className="label-inner flex translate-x-10 -translate-y-14 items-end gap-2">
            <span className="label-line mb-[-6px] block h-px w-8 origin-left rotate-[30deg] bg-ink/40" />
            <span className="whitespace-nowrap">
              <span className="eyebrow block !text-[0.62rem] text-muted">N°{String(i + 1).padStart(2, '0')}</span>
              <span className="lede block text-[1.05rem] text-ink">
                {ing.name} <em className="text-muted">{ing.note}</em>
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Ingredients() {
  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    gsap.to(stage, {
      gather: 1,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top 65%', end: 'top 5%', scrub: reduced ? false : true },
    })
    revealLines(q('.line-inner'), root, {}, 'top 55%')
    if (!reduced) {
      gsap.from(q('[data-fade]'), {
        autoAlpha: 0,
        y: 30,
        stagger: 0.08,
        duration: 1.2,
        scrollTrigger: { trigger: root, start: 'top 40%', once: true },
      })
    }
  })

  return (
    <section ref={ref} id="maison" className="relative px-[var(--gutter)] pt-[24vh] pb-[16vh] md:h-[230vh] md:py-0" aria-labelledby="ingredients-title">
      <FloatingLabels />
      <div className="max-w-[34rem] md:sticky md:top-0 md:flex md:h-[100svh] md:flex-col md:justify-center md:pt-[var(--nav-h)]">
        <p className="eyebrow mb-8 text-wine" data-fade>
          01 — La matière
        </p>
        <SplitText
          id="ingredients-title"
          text={'Tout commence\navec de bons\n*ingrédients.*'}
          className="display text-[clamp(3rem,6.6vw,6.6rem)] text-ink"
        />
        <p className="mt-10 max-w-[25rem] text-[1.02rem] text-muted" data-fade>
          Un fruit cueilli mûr, une pistache torréfiée juste ce qu’il faut, un lait entier, une gousse de vanille fendue à
          la main. Rien d’autre, et surtout rien de trop.
        </p>
        {/* readable list for small screens and assistive tech */}
        <ul
          className="relative mt-[55vh] grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink/15 pt-6 max-md:-mx-3 max-md:bg-cream/85 max-md:p-4 max-md:backdrop-blur-md md:mt-12 md:max-w-[25rem]"
          data-fade
        >
          {INGREDIENTS.map((ing, i) => (
            <li key={ing.name} className="flex items-baseline gap-3 text-sm">
              <span className="eyebrow !text-[0.6rem] text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span>
                {ing.name} <span className="text-muted">— {ing.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
