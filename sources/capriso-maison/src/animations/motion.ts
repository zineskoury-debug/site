import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { stage } from '../3d/stage'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'expo.out', duration: 1.2 })

export { gsap, ScrollTrigger }

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null
export const getLenis = () => lenis

/** Smooth, inertial scroll synced with ScrollTrigger. Skipped for reduced motion. */
export function initSmoothScroll() {
  stage.reducedMotion = prefersReducedMotion()
  if (stage.reducedMotion || lenis) return () => {}
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4 })
  let rawVelocity = 0
  lenis.on('scroll', (l: Lenis) => {
    ScrollTrigger.update()
    rawVelocity = l.velocity
  })
  const tick = (time: number, delta: number) => {
    lenis?.raf(time * 1000)
    // smoothed, normalised scroll speed that drives stretch / skew / marquee effects
    const target = Math.max(-1, Math.min(1, rawVelocity / 45))
    rawVelocity *= 0.9
    stage.velocity += (target - stage.velocity) * (1 - Math.exp(-delta / 90))
  }
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTarget(target: string | HTMLElement) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 })
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  // move focus for keyboard and screen-reader users
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

/**
 * Run GSAP code scoped to a component; everything is reverted on unmount.
 * The callback receives `reduced` so it can fall back to final states.
 */
export function useGsap<T extends Element>(
  fn: (ctx: { root: T; reduced: boolean; q: (sel: string) => HTMLElement[] }) => void,
  deps: DependencyList = [],
): RefObject<T | null> {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = prefersReducedMotion()
    const ctx = gsap.context(() => fn({ root, reduced, q: (sel) => gsap.utils.toArray<HTMLElement>(sel, root) }), root)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/**
 * Reveal for SplitText output, played once when the trigger enters.
 * Titles split into characters flip up one by one in 3D; plain lines slide out of their mask.
 */
export function revealLines(targets: gsap.TweenTarget, trigger: Element, vars: gsap.TweenVars = {}, start = 'top 82%') {
  if (prefersReducedMotion()) return null
  const lines = gsap.utils.toArray<HTMLElement>(targets)
  const chars = lines.flatMap((el) => Array.from(el.querySelectorAll<HTMLElement>('.char')))
  const scrollTrigger = { trigger, start, once: true }
  if (chars.length) {
    const { stagger: _ignored, ...rest } = vars
    void _ignored
    return gsap.from(chars, {
      yPercent: 115,
      rotateX: -100,
      rotateZ: 8,
      opacity: 0,
      transformPerspective: 700,
      transformOrigin: '50% 100%',
      duration: 1.5,
      ease: 'expo.out',
      stagger: { each: 0.028, from: 'start' },
      clearProps: 'transform,opacity',
      ...rest,
      scrollTrigger,
    })
  }
  return gsap.from(lines, { yPercent: 115, rotate: 2, duration: 1.4, stagger: 0.09, ...vars, scrollTrigger })
}
