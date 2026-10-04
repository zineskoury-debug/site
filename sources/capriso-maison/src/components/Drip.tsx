import { useId, useMemo } from 'react'
import { gsap, useGsap } from '../animations/motion'
import { createRandom } from '../3d/noise'

type Props = {
  /** Colour of the section above, which "melts" into this one. CSS colour or var(). */
  color: string
  seed?: number
  /** Number of drips across the width. */
  count?: number
  className?: string
}

const W = 1440
const H = 260

/**
 * Melting edge: the colour of the previous section drips into the next one.
 * Drips lengthen with scroll and a few drops detach and fall; a gooey SVG filter
 * makes everything merge like real melting gelato.
 */
export function Drip({ color, seed = 1, count = 13, className = '' }: Props) {
  const id = useId().replace(/:/g, '')
  const drips = useMemo(() => {
    const rand = createRandom(seed)
    return Array.from({ length: count }, (_, i) => {
      const slot = W / count
      const w = 26 + rand() * 46
      return {
        x: slot * i + slot * 0.15 + rand() * slot * 0.7 - w / 2,
        w,
        len: 70 + rand() * (H - 110),
        drop: rand() > 0.45,
        delay: rand(),
      }
    })
  }, [seed, count])

  const ref = useGsap<SVGSVGElement>(({ root, q, reduced }) => {
    const trigger = root.parentElement ?? root
    if (reduced) return
    q('[data-drip]').forEach((d, i) => {
      gsap.fromTo(
        d,
        { scaleY: 0.08 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: '50% 0%',
          scrollTrigger: { trigger, start: `top ${92 - drips[i].delay * 12}%`, end: `top ${18 + drips[i].delay * 10}%`, scrub: 0.8 },
        },
      )
    })
    q('[data-drop]').forEach((d) => {
      gsap.fromTo(
        d,
        { y: -30, scale: 0, transformOrigin: '50% 50%' },
        {
          y: 190,
          scale: 1,
          ease: 'power2.in',
          scrollTrigger: { trigger, start: 'top 40%', end: 'top -15%', scrub: 0.8 },
        },
      )
    })
  })

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 block h-auto w-full ${className}`}
      aria-hidden="true"
      style={{ color, overflow: 'visible' }}
    >
      <defs>
        <filter id={`goo-${id}`} x="-5%" y="-20%" width="110%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g filter={`url(#goo-${id})`} fill="currentColor">
        <rect x={-40} y={-60} width={W + 80} height={84} />
        {drips.map((d, i) => (
          <g key={i}>
            <g data-drip>
              <rect x={d.x} y={0} width={d.w} height={d.len} rx={d.w / 2} />
              <circle cx={d.x + d.w / 2} cy={d.len - d.w * 0.35} r={d.w * 0.62} />
            </g>
            {d.drop && <circle data-drop cx={d.x + d.w / 2} cy={d.len + d.w * 0.9} r={d.w * 0.32} />}
          </g>
        ))}
      </g>
    </svg>
  )
}
