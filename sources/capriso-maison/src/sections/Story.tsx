import { useRef } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { SplitText } from '../components/SplitText'
import { asset } from '../data/site'

const TEXT = [
  'Nous croyons qu’une bonne glace commence bien avant la première cuillère.',
  'Elle commence par un fruit mûr, une pistache de qualité, une vanille choisie avec soin et le temps nécessaire pour bien faire les choses.',
]

export function Story() {
  const img = useRef<HTMLDivElement>(null)

  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    revealLines(q('[data-title] .line-inner'), root, {}, 'top 70%')
    if (reduced) return
    // words light up as you read
    gsap.fromTo(
      q('[data-word]'),
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: { trigger: q('[data-copy]')[0], start: 'top 75%', end: 'bottom 45%', scrub: true },
      },
    )
    gsap.fromTo(
      q('[data-parallax]'),
      { yPercent: 10 },
      { yPercent: -10, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
    gsap.from(img.current, {
      clipPath: 'inset(100% 0% 0% 0%)',
      duration: 1.8,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: img.current, start: 'top 80%', once: true },
    })
  })

  // image follows the pointer slightly, with a slow zoom on hover
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    gsap.to(e.currentTarget.querySelector('img'), {
      x: ((e.clientX - r.left) / r.width - 0.5) * 18,
      y: ((e.clientY - r.top) / r.height - 0.5) * 18,
      duration: 1.2,
      ease: 'power3.out',
    })
  }

  return (
    <section
      ref={ref}
      id="histoire"
      className="relative z-10 grid gap-[8vh] bg-ivory px-[var(--gutter)] py-[22vh] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-[6vw]"
      aria-labelledby="story-title"
    >
      <div className="md:pt-[6vh]">
        <div data-title>
          <p className="eyebrow mb-6 text-wine">06 — La maison</p>
          <SplitText id="story-title" text={'Notre\n*histoire*'} className="display text-[clamp(3.4rem,7.4vw,7.4rem)] text-ink" />
        </div>
        <div
          ref={img}
          data-parallax
          data-skew
          className="group relative mt-[10vh] aspect-[3/4] w-[78%] max-w-[420px] overflow-hidden bg-[#efd9cf] md:w-[85%]"
          onPointerMove={onMove}
          data-cursor="Voir"
        >
          <img
            src={asset('images/story.webp')}
            alt="Cornet gaufré et boule de glace à la fraise"
            loading="lazy"
            decoding="async"
            className="absolute inset-[-4%] h-[108%] w-[108%] object-contain transition-transform duration-[2.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
        </div>
      </div>

      <div data-copy className="self-center">
        {TEXT.map((para, pi) => (
          <p key={pi} className={`lede text-[clamp(1.6rem,3.1vw,3rem)] text-ink ${pi ? 'mt-[0.9em]' : ''}`}>
            {para.split(' ').map((w, i) => (
              <span key={i}>
                <span data-word className="word">
                  {w}
                </span>{' '}
              </span>
            ))}
          </p>
        ))}
        <p className="eyebrow mt-14 text-muted">— Capriso, passione per il gelato</p>
      </div>
    </section>
  )
}
