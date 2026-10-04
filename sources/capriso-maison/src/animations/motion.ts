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
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis?.raf(time * 1000)
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
export function useGsap<T extends HTMLElement>(
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

/** Masked line reveal for SplitText lines, played once when the trigger enters. */
export function revealLines(targets: gsap.TweenTarget, trigger: Element, vars: gsap.TweenVars = {}, start = 'top 82%') {
  if (prefersReducedMotion()) return null
  return gsap.from(targets, {
    yPercent: 115,
    rotate: 2,
    duration: 1.4,
    stagger: 0.09,
    ...vars,
    scrollTrigger: { trigger, start, once: true },
  })
}
