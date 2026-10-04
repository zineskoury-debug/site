import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { SplitText } from '../components/SplitText'
import { flavors } from '../data/flavors'

/**
 * The collection. Desktop: hovering (or focusing) a name swaps the large image behind it
 * with a masked reveal and tints the whole section. Mobile: an editorial stack.
 */
export function Flavors() {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const images = useRef<(HTMLDivElement | null)[]>([])
  const prev = useRef(0)

  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    revealLines(q('[data-title] .line-inner'), root, {}, 'top 70%')
    if (reduced) return
    gsap.from(q('[data-name]'), {
      yPercent: 100,
      autoAlpha: 0,
      stagger: 0.07,
      duration: 1.3,
      scrollTrigger: { trigger: q('[data-list]')[0], start: 'top 75%', once: true },
    })
    gsap.from(q('[data-panel]'), {
      clipPath: 'inset(100% 0% 0% 0%)',
      duration: 1.6,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: q('[data-list]')[0], start: 'top 70%', once: true },
    })
    q('[data-mobile-card]').forEach((card) => {
      gsap.from(card.querySelector('[data-mobile-img]'), {
        clipPath: 'inset(18% 10% 18% 10%)',
        scale: 1.15,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 35%', scrub: true },
      })
    })
  })

  // masked crossfade between product images
  useEffect(() => {
    const from = images.current[prev.current]
    const to = images.current[active]
    if (!to || prev.current === active) return
    const down = active > prev.current
    gsap.killTweensOf([to, to.firstElementChild])
    gsap.set(to, { zIndex: 2, autoAlpha: 1 })
    if (from) gsap.set(from, { zIndex: 1 })
    gsap.fromTo(
      to,
      { clipPath: down ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.out' },
    )
    gsap.fromTo(to.firstElementChild, { scale: 1.18, yPercent: down ? 6 : -6 }, { scale: 1, yPercent: 0, duration: 1.6, ease: 'expo.out' })
    images.current.forEach((el, i) => {
      if (el && i !== active && i !== prev.current) gsap.set(el, { autoAlpha: 0, zIndex: 0 })
    })
    prev.current = active
  }, [active])

  // the image drifts gently with the pointer
  const onMove = useCallback((e: React.PointerEvent) => {
    const el = stageRef.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el.querySelectorAll('[data-depth]'), {
      x: (_, t: HTMLElement) => x * Number(t.dataset.depth),
      y: (_, t: HTMLElement) => y * Number(t.dataset.depth),
      duration: 1.2,
      ease: 'power3.out',
    })
  }, [])

  const f = flavors[active]

  return (
    <section
      ref={ref}
      id="parfums"
      className="relative z-10 overflow-hidden px-[var(--gutter)] py-[16vh] transition-colors duration-1000"
      style={{ backgroundColor: `color-mix(in oklab, ${f.tint} 55%, var(--color-ivory))` }}
      aria-labelledby="parfums-title"
    >
      <header className="mb-[10vh] grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
        <div data-title>
          <p className="eyebrow mb-6 text-wine">03 — La collection</p>
          <SplitText id="parfums-title" text={'Les\n*parfums*'} className="display text-[clamp(4rem,12vw,12rem)] text-ink" />
        </div>
        <p className="max-w-[24rem] text-[1.02rem] text-muted md:justify-self-end">
          Six classiques travaillés comme des grands crus. Peu d’ingrédients, choisis pour leur goût, et le temps qu’il faut
          à chacun.
        </p>
      </header>

      {/* desktop: interactive list + image stage */}
      <div className="hidden grid-cols-[1fr_1.05fr] gap-[5vw] md:grid" onPointerMove={onMove}>
        <ul data-list className="flex flex-col justify-center" role="list">
          {flavors.map((fl, i) => (
            <li key={fl.id} className="overflow-hidden border-b border-ink/10 first:border-t">
              <button
                type="button"
                data-name
                data-cursor="Découvrir"
                className="group flex w-full items-baseline gap-6 py-[1.4vh] text-left"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-controls="flavor-detail"
              >
                <span className="eyebrow w-8 !text-[0.62rem] text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`display block text-[clamp(2.6rem,5.4vw,5.6rem)] transition-[transform,color,opacity] duration-700 ease-[var(--ease-out-expo)] ${
                    i === active ? 'translate-x-4 text-ink' : 'text-ink/50 group-hover:text-ink/75'
                  }`}
                >
                  {i === active ? <em>{fl.name}</em> : fl.name}
                </span>
                <span
                  className={`eyebrow ml-auto !text-[0.62rem] transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
                  style={{ color: fl.ink }}
                >
                  {fl.italian}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div ref={stageRef} data-panel className="relative aspect-[4/5] max-h-[86vh] w-full overflow-hidden rounded-[2px]">
          {flavors.map((fl, i) => (
            <div
              key={fl.id}
              ref={(el) => {
                images.current[i] = el
              }}
              className="grain absolute inset-0 overflow-hidden"
              style={{ backgroundColor: fl.tint, visibility: i === 0 ? 'visible' : 'hidden', zIndex: i === 0 ? 1 : 0 }}
            >
              <div className="absolute inset-0">
                <div
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(70% 55% at 50% 45%, rgba(255,255,255,.55), transparent 70%)` }}
                />
                <span
                  data-depth="-18"
                  className="display absolute top-[6%] left-[6%] text-[clamp(5rem,11vw,11rem)] opacity-[0.13]"
                  style={{ color: fl.ink }}
                  aria-hidden="true"
                >
                  <em>{fl.italian}</em>
                </span>
                <img
                  data-depth="26"
                  src={fl.image}
                  alt={`Glace ${fl.name.toLowerCase()} dans une coupe Capriso`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-x-[8%] bottom-[4%] h-[88%] w-[84%] object-contain"
                />
              </div>
            </div>
          ))}
          <div
            id="flavor-detail"
            className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-[1fr_auto] items-end gap-6 p-[clamp(1.25rem,2.4vw,2.25rem)]"
            style={{ color: f.ink }}
            aria-live="polite"
          >
            <p key={f.id} className="max-w-[19rem] animate-[fadeup_.9s_var(--ease-out-expo)_both] text-[0.95rem] leading-relaxed">
              {f.description}
            </p>
            <ul key={`${f.id}-i`} className="animate-[fadeup_.9s_.08s_var(--ease-out-expo)_both] space-y-1 text-right">
              {f.ingredients.map((ing) => (
                <li key={ing} className="eyebrow !text-[0.6rem]">
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* mobile: stacked cards */}
      <ol className="space-y-[12vh] md:hidden">
        {flavors.map((fl, i) => (
          <li key={fl.id} data-mobile-card>
            <div data-mobile-img className="grain relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: fl.tint }}>
              <img
                src={fl.image}
                alt={`Glace ${fl.name.toLowerCase()} dans une coupe Capriso`}
                loading="lazy"
                decoding="async"
                className="absolute inset-x-[6%] bottom-[4%] h-[86%] w-[88%] object-contain"
              />
              <span className="eyebrow absolute top-4 left-4 !text-[0.6rem]" style={{ color: fl.ink }}>
                {String(i + 1).padStart(2, '0')} — {fl.italian}
              </span>
            </div>
            <h3 className="display mt-6 text-[3.4rem] text-ink">{i % 2 ? <em>{fl.name}</em> : fl.name}</h3>
            <p className="mt-3 text-[0.98rem] text-muted">{fl.description}</p>
            <p className="eyebrow mt-4 !text-[0.6rem] text-ink">{fl.ingredients.join(' · ')}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
