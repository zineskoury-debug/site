import { useState } from 'react'
import { gsap, revealLines, useGsap } from '../animations/motion'
import { flavors } from '../data/flavors'
import { SplitText } from '../components/SplitText'
import { products } from '../data/products'

const LAYOUT = ['md:col-span-5 md:row-start-1', 'md:col-span-4 md:col-start-7 md:mt-[22vh]', 'md:col-span-4 md:col-start-2 md:-mt-[8vh]']
const TINTS = ['#e3e1c7', '#f3dcd6', '#ead7c4']

export function Choose() {
  const [flipped, setFlipped] = useState<boolean[]>(() => products.map(() => false))
  const toggle = (i: number) => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)))
  const ref = useGsap<HTMLElement>(({ root, q, reduced }) => {
    revealLines(q('[data-title] .line-inner'), root, {}, 'top 70%')
    if (reduced) return
    q('[data-product]').forEach((card, i) => {
      gsap.from(card.querySelector('[data-frame]'), {
        clipPath: 'inset(100% 0% 0% 0%)',
        clearProps: 'clipPath',
        duration: 1.6,
        ease: 'expo.inOut',
        delay: i * 0.08,
        scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      })
      gsap.from(card.querySelector('img'), {
        scale: 1.3,
        duration: 2.2,
        ease: 'expo.out',
        delay: i * 0.08 + 0.2,
        scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      })
      gsap.fromTo(
        card,
        { y: 60 * (i + 1) },
        { y: -30 * (i + 1), ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    })
  })

  // depth: the scoop follows the pointer more than its frame
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(e.currentTarget.querySelector('[data-img-wrap]'), { x: x * 26, y: y * 20, rotateY: x * 8, rotateX: -y * 8, duration: 1, ease: 'power3.out' })
    gsap.to(e.currentTarget.querySelector('[data-info]'), { x: x * -10, duration: 1, ease: 'power3.out' })
  }
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    gsap.to(e.currentTarget.querySelectorAll('[data-img-wrap], [data-info]'), { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 1.2, ease: 'expo.out' })
  }

  return (
    <section ref={ref} id="choisir" className="relative z-10 overflow-hidden bg-cream px-[var(--gutter)] py-[20vh]" aria-labelledby="choose-title">
      <header className="mb-[12vh] grid items-end gap-8 md:grid-cols-2">
        <div data-title>
          <p className="eyebrow mb-6 text-wine">07 — Au comptoir</p>
          <SplitText id="choose-title" text={'Choisissez\nvotre *parfum.*'} className="display text-[clamp(3.2rem,8vw,8.2rem)] text-ink" />
        </div>
        <p className="max-w-[22rem] text-[1.02rem] text-muted md:justify-self-end">
          Une, deux ou trois boules, en cornet croustillant ou en coupe. Les parfums changent au fil des saisons, les prix
          restent simples.
        </p>
      </header>

      <ul className="grid gap-[12vh] md:grid-cols-12 md:gap-x-[2vw] md:gap-y-0">
        {products.map((p, i) => (
          <li key={p.id} data-product className={LAYOUT[i]}>
            <article className="group" onPointerMove={onMove} onPointerLeave={onLeave} data-cursor="Voir">
              <div data-frame data-skew className="relative aspect-[4/5] [perspective:1400px]">
                <div className={`flipper absolute inset-0 ${flipped[i] ? 'is-flipped' : ''}`}>
                  {/* front: the product */}
                  <div className="face grain absolute inset-0 overflow-hidden [perspective:900px]" style={{ backgroundColor: TINTS[i] }}>
                    <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(255,255,255,.6),transparent_70%)]" />
                    <span className="display absolute top-5 left-5 text-[clamp(3rem,6vw,6rem)] text-ink/10" aria-hidden="true">
                      <em>{p.italian}</em>
                    </span>
                    <div data-img-wrap className="absolute inset-0 [transform-style:preserve-3d]">
                      <img
                        src={p.image}
                        alt={p.alt}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-x-[8%] bottom-[5%] h-[86%] w-[84%] object-contain transition-transform duration-[2.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                      />
                    </div>
                    <span className="eyebrow absolute right-5 bottom-5 translate-y-3 rounded-full bg-ivory/85 px-4 py-2 !text-[0.6rem] text-ink opacity-0 backdrop-blur transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100">
                      ↻ Retourner
                    </span>
                  </div>
                  {/* back: what is inside */}
                  <div className="face face--back grain absolute inset-0 flex flex-col justify-between overflow-hidden bg-wine p-[clamp(1.25rem,2.6vw,2.25rem)] text-ivory">
                    <span className="display outline-num-light pointer-events-none absolute -right-[0.08em] -bottom-[0.2em] text-[clamp(12rem,24vw,22rem)]" aria-hidden="true">
                      {p.scoops}
                    </span>
                    <p className="eyebrow relative text-vanilla">
                      {p.italian} — {p.scoops} {p.scoops > 1 ? 'parfums' : 'parfum'}
                    </p>
                    <div className="relative">
                      <p className="display text-[clamp(3.6rem,7vw,6.4rem)]">{p.price}</p>
                      <ul className="mt-6 space-y-2 text-[0.95rem] text-ivory/85">
                        <li>Au choix : cornet croustillant ou coupe.</li>
                        <li>
                          Parmi : {flavors.map((f) => f.name).join(', ')}.
                        </li>
                      </ul>
                    </div>
                    <p className="eyebrow relative !text-[0.6rem] text-ivory/70">↺ Cliquez pour revenir</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer rounded-[2px]"
                  aria-pressed={flipped[i]}
                  aria-label={flipped[i] ? `Revenir à l’image de ${p.name.toLowerCase()}` : `Voir le détail de ${p.name.toLowerCase()}`}
                  data-cursor={flipped[i] ? 'Retour' : 'Retourner'}
                  data-sprinkle={i === 0 ? '#9aa66a,#b4b97e,#d6a05c' : i === 1 ? '#eba1a6,#f3e4bd,#c94a5a' : '#5b3424,#c99d72,#f4eaa8'}
                  onClick={() => toggle(i)}
                />
              </div>
              <div data-info className="mt-6 flex items-start justify-between gap-6">
                <div>
                  <h3 className="display text-[clamp(2rem,3vw,2.8rem)] text-ink">{p.name}</h3>
                  <p className="mt-2 max-w-[18rem] text-sm text-muted">{p.description}</p>
                </div>
                <p className="text-right">
                  <span className="lede block text-[1.6rem] text-wine">{p.price}</span>
                  <span className="eyebrow !text-[0.6rem] text-muted">
                    {p.scoops} {p.scoops > 1 ? 'parfums' : 'parfum'}
                  </span>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
