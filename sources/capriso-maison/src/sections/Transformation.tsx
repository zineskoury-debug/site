import { useRef, useState } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { stage } from '../3d/stage'
import { SplitText } from '../components/SplitText'

const STEPS = [
  { title: 'Mélanger', text: 'Lait, sucre et fruit, pesés au gramme.' },
  { title: 'Maturer', text: 'Le mélange repose une nuit au froid.' },
  { title: 'Turbiner', text: 'Lentement, pour une texture dense et soyeuse.' },
  { title: 'Servir', text: 'À −12 °C, la température du fondant.' },
]

/** Sticky chapter: the ingredients flow back into the cup and a gelato forms. */
export function Transformation() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const bar = useRef<HTMLSpanElement>(null)

  const ref = useGsap<HTMLElement>(({ root, q }) => {
    gsap.to(stage, {
      converge: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const i = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length * 0.999))
          if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`
          if (i !== activeRef.current) {
            activeRef.current = i
            setActive(i)
          }
        },
      },
    })
    revealLines(q('.line-inner'), root, {}, 'top 30%')
  })

  return (
    <section ref={ref} id="transformation" className="relative h-[320vh]" aria-labelledby="transformation-title">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-between px-[var(--gutter)] pt-[calc(var(--nav-h)+4vh)] pb-8">
        <div className="text-center">
          <p className="eyebrow mb-6 text-wine">02 — La transformation</p>
          <SplitText
            id="transformation-title"
            text={'De l’ingrédient\nà la *glace.*'}
            className="display text-[clamp(2.8rem,6.4vw,6.4rem)] text-ink"
          />
        </div>

        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto_1fr]">
          <ol className="hidden gap-8 md:col-span-3 md:grid md:grid-cols-4" aria-label="Les étapes">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={`border-t pt-4 transition-[opacity,border-color] duration-700 ${
                  i <= active ? 'border-ink opacity-100' : 'border-ink/15 opacity-55'
                }`}
                aria-current={i === active ? 'step' : undefined}
              >
                <span className="eyebrow !text-[0.6rem] text-muted">Étape {String(i + 1).padStart(2, '0')}</span>
                <p className="lede mt-2 text-[1.5rem] text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          {/* compact version for small screens */}
          <div className="md:hidden">
            <div className="relative h-px w-full bg-ink/15">
              <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-wine" />
            </div>
            <p className="mt-4 flex items-baseline justify-between">
              <span className="lede text-[1.6rem] text-ink">{STEPS[active].title}</span>
              <span className="eyebrow !text-[0.6rem] text-muted">
                {String(active + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </span>
            </p>
            <p className="text-sm text-muted" aria-live="polite">
              {STEPS[active].text}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
