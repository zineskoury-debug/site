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
    // the image opens from an inset frame to full bleed
    if (!reduced) gsap.fromTo(
      media,
      { clipPath: 'inset(12% 14% 12% 14% round 18px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top 85%', end: 'top top', scrub: true },
      },
    )
    if (!reduced) gsap.fromTo(
      q('[data-media-img]'),
      { scale: 1.12, yPercent: -3 },
      { scale: 1, yPercent: 3, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
    const steps = q('[data-step]')
    steps.forEach((step) => {
      if (reduced) return
      step.querySelectorAll<SVGPathElement>('path').forEach((p) => {
        const len = p.getTotalLength()
        p.style.strokeDasharray = `${len}`
        p.style.strokeDashoffset = `${len}`
      })
    })
    const mm = gsap.matchMedia()
    // desktop: the four gestures slide horizontally while the page scrolls
    mm.add('(min-width: 768px)', () => {
      const wrap = q('[data-hwrap]')[0]
      const track = q('[data-track]')[0]
      const bar = q('[data-hbar]')[0]
      const count = q('[data-hcount]')[0]
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`
            count.textContent = String(Math.min(steps.length, Math.floor(self.progress * steps.length) + 1)).padStart(2, '0')
          },
        },
      })
      if (reduced) return
      steps.forEach((step) => {
        gsap.to(step.querySelectorAll('path'), {
          strokeDashoffset: 0,
          stagger: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 90%', end: 'left 40%', scrub: true },
        })
        gsap.from(step.querySelectorAll('[data-step-text]'), {
          y: 60,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 1.3,
          scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 75%', once: true },
        })
        gsap.fromTo(
          step.querySelector('[data-num]'),
          { xPercent: 40, rotate: 8 },
          { xPercent: -30, rotate: -4, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } },
        )
      })
    })
    // mobile: classic vertical reveal
    mm.add('(max-width: 767px)', () => {
      if (reduced) return
      steps.forEach((step) => {
        gsap.to(step.querySelectorAll('path'), {
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

      <div data-hwrap className="relative md:h-[400vh]">
        <div className="md:sticky md:top-0 md:flex md:h-[100svh] md:flex-col md:justify-center md:overflow-hidden">
          <div className="hidden items-center gap-6 px-[var(--gutter)] md:mb-[7vh] md:flex">
            <p className="eyebrow text-wine">Quatre gestes</p>
            <span className="relative h-px flex-1 bg-ink/15">
              <span data-hbar className="absolute inset-0 origin-left scale-x-0 bg-wine" />
            </span>
            <p className="eyebrow tabular-nums text-muted">
              <span data-hcount>01</span> / {String(STEPS.length).padStart(2, '0')}
            </p>
          </div>
          <ol data-track className="grid gap-y-[14vh] px-[var(--gutter)] py-[18vh] md:flex md:w-max md:gap-[7vw] md:py-0 md:pr-[20vw]">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative grid grid-cols-[auto_1fr] gap-6 md:w-[min(58vw,820px)] md:shrink-0 md:gap-10" data-skew="-1">
                <span
                  data-num
                  className="display outline-num pointer-events-none absolute -top-[0.32em] right-0 text-[clamp(7rem,22vw,20rem)] max-md:hidden"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <svg
                  viewBox="0 0 120 120"
                  className="relative h-24 w-24 text-wine md:h-40 md:w-40"
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
                <div className="relative md:pt-6">
                  <p data-step-text className="eyebrow text-muted">
                    Étape {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 data-step-text className="display mt-3 text-[clamp(2.4rem,5.4vw,5.6rem)] text-ink">
                    {i % 2 ? <em>{s.title}</em> : s.title}
                  </h3>
                  <p data-step-text className="mt-5 max-w-[26rem] text-[1.02rem] text-muted">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
