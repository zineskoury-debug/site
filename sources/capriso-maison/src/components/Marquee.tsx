import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../animations/motion'
import { stage } from '../3d/stage'
import { flavors } from '../data/flavors'

type BandProps = {
  words: string[]
  className: string
  /** px per second at rest; sign gives the default direction. */
  speed: number
  rotate: number
}

/** Tiny scoop used as a separator. */
const Scoop = ({ color }: { color: string }) => (
  <svg viewBox="0 0 40 52" className="mx-[0.35em] inline-block h-[0.62em] w-auto align-[0.02em]" aria-hidden="true">
    <path d="M9 24 20 50 31 24Z" fill="#d39a55" />
    <path d="M12 28h16M14 33h12M16 38h8" stroke="#9b6230" strokeWidth="1.6" />
    <circle cx="20" cy="17" r="14" fill={color} />
    <path d="M7 22c4 3 7-1 10 2s7 0 9-1 5 2 7 0" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
  </svg>
)

function Band({ words, className, speed, rotate }: BandProps) {
  const track = useRef<HTMLDivElement>(null)
  const band = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = track.current!
    if (prefersReducedMotion()) return
    let x = 0
    let dir = Math.sign(speed)
    let slow = 1
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    // hovering a band slows it down so it can be read
    const b = band.current!
    const onEnter = () => (slow = 0.25)
    const onLeave = () => (slow = 1)
    b.addEventListener('pointerenter', onEnter)
    b.addEventListener('pointerleave', onLeave)
    const setX = gsap.quickSetter(el, 'x', 'px') as (v: number) => void
    const skew = gsap.quickSetter(el, 'skewX', 'deg') as (v: number) => void
    const tick = (_: number, delta: number) => {
      if (!visible) return
      const v = stage.velocity
      // scrolling up reverses the bands, scrolling fast speeds them up
      if (Math.abs(v) > 0.05) dir = Math.sign(v) * Math.sign(speed)
      const half = el.scrollWidth / 2
      x -= (Math.abs(speed) * slow + Math.abs(v) * 900) * dir * (delta / 1000)
      if (x <= -half) x += half
      if (x > 0) x -= half
      setX(x)
      skew(-v * 10)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      b.removeEventListener('pointerenter', onEnter)
      b.removeEventListener('pointerleave', onLeave)
    }
  }, [speed])

  const items = [...words, ...words]
  return (
    <div ref={band} className={`relative -mx-4 overflow-hidden py-[0.35em] ${className}`} style={{ rotate: `${rotate}deg` }}>
      <div ref={track} className="flex w-max whitespace-nowrap will-change-transform">
        {items.map((w, i) => (
          <span key={i} className="display flex items-center px-[0.25em] text-[clamp(2.6rem,7vw,7rem)] leading-none">
            {i % 2 ? <em>{w}</em> : w}
            <Scoop color={flavors[i % flavors.length].gelato.base} />
          </span>
        ))}
      </div>
    </div>
  )
}

/** Two crossing bands between chapters. */
export function Marquee() {
  return (
    <section className="relative z-10 overflow-hidden bg-ivory py-[14vh]" aria-label="Nos parfums">
      <Band words={flavors.map((f) => f.italian)} className="bg-wine text-ivory" speed={90} rotate={-3} />
      <Band words={['Fatto a mano', 'Ogni giorno', 'Bachkou', 'Casablanca', 'Passione']} className="-mt-3 bg-vanilla text-ink" speed={-70} rotate={2.5} />
    </section>
  )
}
