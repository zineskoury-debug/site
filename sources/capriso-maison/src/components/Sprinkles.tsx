import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../animations/motion'

const PALETTE = ['#a72438', '#e5949e', '#9aa66a', '#f2dc9b', '#e5863a', '#5b3424', '#fbf8f2', '#fecd33']

type Sprinkle = { x: number; y: number; vx: number; vy: number; r: number; vr: number; len: number; w: number; color: string; life: number; max: number }

export type SprinkleDetail = { x: number; y: number; count?: number; colors?: string[]; power?: number }

/** Fire a burst from anywhere in the app. */
export function burst(detail: SprinkleDetail) {
  window.dispatchEvent(new CustomEvent<SprinkleDetail>('sprinkle', { detail }))
}

/**
 * Click anywhere: a handful of gelato sprinkles burst from the pointer, spin and fall.
 * Elements can tint their burst with data-sprinkle="#hex,#hex".
 * The canvas only animates while sprinkles are alive.
 */
export function Sprinkles() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const parts: Sprinkle[] = []
    let raf = 0
    let last = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()

    const spawn = ({ x, y, count = 22, colors = PALETTE, power = 1 }: SprinkleDetail) => {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5
        const speed = (260 + Math.random() * 520) * power
        parts.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 18,
          len: 7 + Math.random() * 8,
          w: 3 + Math.random() * 2.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          max: 0.9 + Math.random() * 0.7,
        })
      }
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineCap = 'round'
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.life += dt
        if (p.life > p.max) {
          parts.splice(i, 1)
          continue
        }
        p.vy += 1500 * dt
        p.vx *= 1 - 1.6 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.r += p.vr * dt
        const fade = 1 - Math.max(0, (p.life - p.max * 0.6) / (p.max * 0.4))
        ctx.globalAlpha = fade
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.w
        const dx = (Math.cos(p.r) * p.len) / 2
        const dy = (Math.sin(p.r) * p.len) / 2
        ctx.beginPath()
        ctx.moveTo(p.x - dx, p.y - dy)
        ctx.lineTo(p.x + dx, p.y + dy)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      raf = parts.length ? requestAnimationFrame(frame) : 0
      if (!raf) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const target = e.target as Element | null
      if (target?.closest('input, textarea, select, [data-no-sprinkle]')) return
      const tinted = target?.closest<HTMLElement>('[data-sprinkle]')
      spawn({ x: e.clientX, y: e.clientY, colors: tinted?.dataset.sprinkle?.split(',') })
    }
    const onBurst = (e: Event) => spawn((e as CustomEvent<SprinkleDetail>).detail)

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('sprinkle', onBurst)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('sprinkle', onBurst)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[85] h-full w-full" aria-hidden="true" />
}
