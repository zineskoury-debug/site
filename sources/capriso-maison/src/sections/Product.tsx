import { useRef, useState } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { stage } from '../3d/stage'
import { SplitText } from '../components/SplitText'
import { asset } from '../data/site'

const NOTES = [
  { k: '01', title: 'Lait entier & sucre de canne', at: 0.16 },
  { k: '02', title: 'Turbinée en petites quantités', at: 0.32 },
  { k: '03', title: 'Le pot de 500 ml, à emporter', at: 0.48 },
]

/**
 * Dark, sticky chapter. The 3D tub (rendered by the fixed canvas behind) enters,
 * turns under a moving light and opens. This section only lays text over it.
 */
export function Product({ onGlow, webgl }: { onGlow: (v: number) => void; webgl: boolean }) {
  const [step, setStep] = useState(-1)
  const stepRef = useRef(-1)

  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    gsap.to(stage, {
      product: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        // runs until the section has left, so the tub can follow the page out
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          onGlow(self.progress / 0.76)
          let s = -1
          NOTES.forEach((n, i) => {
            if (self.progress >= n.at) s = i
          })
          if (s !== stepRef.current) {
            stepRef.current = s
            setStep(s)
          }
        },
      },
    })
    revealLines(q('[data-title] .line-inner'), root, {}, 'top 10%')
    if (!reduced) {
      gsap.from(q('[data-tagline] .line-inner'), {
        yPercent: 115,
        stagger: 0.1,
        duration: 1.4,
        scrollTrigger: { trigger: root, start: '55% bottom', once: true },
      })
    }
  })

  return (
    <section
      ref={ref}
      id="notre-glace"
      data-theme="dark"
      className="relative h-[420vh] text-ivory"
      aria-labelledby="product-title"
    >
      <div className="sticky top-0 grid h-[100svh] grid-rows-[auto_1fr_auto] px-[var(--gutter)] pt-[calc(var(--nav-h)+4vh)] pb-10">
        <div data-title className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow mb-6 text-vanilla">04 — L’objet</p>
            <SplitText id="product-title" text={'Notre\n*glace*'} className="display text-[clamp(3.6rem,9vw,9rem)]" />
          </div>
          <p className="eyebrow hidden max-w-[12rem] text-right text-ivory/55 md:block">Pistacchio · 500 ml</p>
        </div>

        {!webgl && (
          <img
            src={asset('images/tub.webp')}
            alt="Pot de glace Capriso à la pistache, couvercle laqué ouvert"
            loading="lazy"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[62vh] w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        )}
        <ul className="relative hidden md:block" aria-label="Ce qui fait notre glace">
          {NOTES.map((n, i) => (
            <li
              key={n.k}
              className={`absolute flex max-w-[15rem] items-start gap-3 transition-[opacity,transform] duration-1000 ease-[var(--ease-out-expo)] ${
                i <= step ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              } ${['top-[12%] left-0', 'top-[46%] right-0 text-right flex-row-reverse', 'bottom-[6%] left-[4%]'][i]}`}
            >
              <span className="eyebrow mt-1 !text-[0.6rem] text-vanilla">{n.k}</span>
              <span className="lede text-[1.25rem]">{n.title}</span>
            </li>
          ))}
        </ul>

        <div data-tagline className="flex items-end justify-between gap-6 max-md:row-start-3">
          <SplitText
            as="p"
            text={'Des ingrédients simples.\n*Un savoir-faire précis.*'}
            className="lede text-[clamp(1.4rem,2.6vw,2.4rem)] text-ivory md:ml-auto md:text-right"
          />
        </div>
      </div>
    </section>
  )
}
