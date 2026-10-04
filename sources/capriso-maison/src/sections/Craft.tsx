import { gsap, revealLines, useGsap } from '../animations/motion'
import { SplitText } from '../components/SplitText'
import { asset } from '../data/site'

// Single-stroke drawings, traced on scroll.
const STEPS = [
  {
    title: 'Sélection',
    text: 'Le marché d’abord. Nous goûtons, comparons, et ne gardons que les fruits et les fruits secs qui ont du caractère.',
    paths: [
      'M60 104c-22 0-34-20-34-40 0-16 12-26 34-26s34 10 34 26c0 20-12 40-34 40z',
      'M60 38c-4-8-12-12-22-12 2 10 10 14 22 12zM60 38c4-9 12-14 22-13-2 10-10 15-22 13z',
      'M60 38V18',
      'M46 58l2 2M60 52l1 2M72 60l2 1M52 74l1 2M68 76l2 1M58 90l1 2',
    ],
  },
  {
    title: 'Préparation',
    text: 'Les pâtes sont broyées sur place, la vanille infusée toute une nuit. Les mélanges sont pesés au gramme près.',
    paths: [
      'M18 62h84c0 24-18 40-42 40S18 86 18 62z',
      'M34 102h52',
      'M74 14L58 58',
      'M56 62c-10-6-12-18-4-24 7-5 16 1 14 10-1 6-4 10-10 14z',
    ],
  },
  {
    title: 'Fabrication',
    text: 'Une nuit de maturation, puis un turbinage lent qui fait entrer peu d’air. La glace reste dense, soyeuse, vivante.',
    paths: [
      'M30 20h60v80H30z',
      'M60 34c14 0 20 10 18 20-2 12-16 16-24 10-8-6-4-18 6-16 6 1 8 8 3 10',
      'M30 86h60',
      'M44 94h6M70 94h6',
    ],
  },
  {
    title: 'Dégustation',
    text: 'Servie à la spatule, à −12 °C, en cornet ou en coupe. Le moment pour lequel tout le reste existe.',
    paths: [
      'M40 58l20 50 20-50',
      'M36 58c-4-20 8-36 24-36s28 16 24 36z',
      'M46 70l20 12M50 82l12-6M74 70l-20 12',
      'M92 18L74 44c-2 3-6 2-6-1 0-3 3-6 6-6',
    ],
  },
]

export function Craft() {
  const ref = useGsap<HTMLElement>(({ q, reduced }) => {
    const media = q('[data-media]')[0]
    revealLines(q('[data-title] .line-inner'), media, {}, 'top 35%')
    if (reduced) return
    // the image opens from an inset frame to full bleed
    gsap.fromTo(
      media,
      { clipPath: 'inset(12% 14% 12% 14% round 18px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top 85%', end: 'top top', scrub: true },
      },
    )
    gsap.fromTo(
      q('[data-media-img]'),
      { scale: 1.12, yPercent: -3 },
      { scale: 1, yPercent: 3, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
    q('[data-step]').forEach((step) => {
      const paths = step.querySelectorAll<SVGPathElement>('path')
      paths.forEach((p) => {
        const len = p.getTotalLength()
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
      })
      gsap.to(paths, {
        strokeDashoffset: 0,
        stagger: 0.12,
        ease: 'none',
        scrollTrigger: { trigger: step, start: 'top 85%', end: 'top 35%', scrub: true },
      })
      gsap.from(step.querySelectorAll('[data-step-text]'), {
        y: 40,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.3,
        scrollTrigger: { trigger: step, start: 'top 70%', once: true },
      })
    })
  })

  return (
    <section ref={ref} id="savoir-faire" className="relative z-10 bg-cream" aria-labelledby="craft-title">
      <div
        data-media
        className="relative h-[100svh] min-h-[560px] overflow-hidden text-ivory"
        style={{ background: 'radial-gradient(90% 80% at 60% 60%, #5a3424 0%, #2a1913 62%, #1c100b 100%)' }}
        data-theme="dark"
        data-cursor="Découvrir"
      >
        <div className="grain absolute inset-0" aria-hidden="true" />
        <img
          data-media-img
          src={asset('images/craft.webp')}
          alt="Boule de glace à la pistache, cuillère dorée, pistaches et gousses de vanille posées autour"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[70%_50%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,16,11,.75)_0%,rgba(28,16,11,.15)_55%,transparent)]" aria-hidden="true" />
        <div data-title className="absolute inset-x-[var(--gutter)] bottom-[10vh]">
          <p className="eyebrow mb-6 text-vanilla">05 — Le savoir-faire</p>
          <SplitText id="craft-title" text={'De la terre\nà la *cuillère.*'} className="display text-[clamp(3.4rem,9vw,9.5rem)]" />
        </div>
      </div>

      <ol className="mx-auto grid max-w-[1400px] gap-x-[8vw] gap-y-[14vh] px-[var(--gutter)] py-[20vh] md:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} data-step className={`grid grid-cols-[auto_1fr] gap-6 md:gap-10 ${i % 2 ? 'md:mt-[22vh]' : ''}`}>
            <svg
              viewBox="0 0 120 120"
              className="h-24 w-24 text-wine md:h-32 md:w-32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {s.paths.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
            <div>
              <p data-step-text className="eyebrow text-muted">
                Étape {String(i + 1).padStart(2, '0')}
              </p>
              <h3 data-step-text className="display mt-3 text-[clamp(2.4rem,4.4vw,4.2rem)] text-ink">
                {i % 2 ? <em>{s.title}</em> : s.title}
              </h3>
              <p data-step-text className="mt-5 max-w-[24rem] text-[1rem] text-muted">
                {s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
