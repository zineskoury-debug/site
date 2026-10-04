import { useEffect } from 'react'
import { stage } from '../3d/stage'
import { gsap, prefersReducedMotion } from './motion'

/**
 * Elements marked data-skew lean and stretch with scroll speed, like soft gelato
 * pulled by inertia. data-skew="2" doubles the effect, "-1" inverts it.
 */
export function useVelocityFx(ready: boolean) {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return
    const items = gsap.utils.toArray<HTMLElement>('[data-skew]').map((el) => ({
      k: Number(el.dataset.skew || 1),
      skew: gsap.quickSetter(el, 'skewY', 'deg') as (v: number) => void,
      scaleY: gsap.quickSetter(el, 'scaleY') as (v: number) => void,
    }))
    let last = 1
    const tick = () => {
      const v = stage.velocity
      if (Math.abs(v) < 0.002 && last === 0) return
      last = Math.abs(v) < 0.002 ? 0 : 1
      for (const it of items) {
        it.skew(v * 4 * it.k)
        it.scaleY(1 + Math.abs(v) * 0.05 * Math.abs(it.k))
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [ready])
}
