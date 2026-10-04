/**
 * Shared, mutable choreography state.
 * DOM sections write scroll progress here (via ScrollTrigger); the WebGL scene reads it every frame.
 * Plain object on purpose: no React re-render on scroll.
 */
export const stage = {
  /** Entrance after the preloader, 0 → 1. */
  intro: 0,
  /** 0 at the top of the page → 1 when the hero has scrolled away. */
  hero: 0,
  /** Ingredients burst out of the cup and settle. */
  gather: 0,
  /** Ingredients converge back into a gelato. */
  converge: 0,
  /** Product (tub) section progress, 0 → 1 while it is pinned. */
  product: 0,
  /** Product section is on screen. */
  productOn: false,
  /** Hero → transformation zone is on screen. */
  storyOn: true,
  /** Pointer, normalised to [-1, 1]: raw target and smoothed value. */
  pointerTarget: { x: 0, y: 0 },
  pointer: { x: 0, y: 0 },
  /** Projected screen positions of annotated ingredients (px), written by the scene. */
  labels: [] as { x: number; y: number; visible: number }[],
  /** Scroll velocity, smoothed and normalised to roughly [-1, 1] (positive = scrolling down). */
  velocity: 0,
  /** Index of the flavour currently shown in the hero cup (see data/flavors). */
  heroFlavor: 0,
  reducedMotion: false,
  listeners: new Set<() => void>(),
}

/**
 * Small event bus between the DOM and the scene.
 * - "poke": the hero gelato was clicked
 * - "flavor": the hero gelato now shows stage.heroFlavor
 */
export const bus = new EventTarget()
export const emit = (type: 'poke' | 'flavor') => bus.dispatchEvent(new Event(type))
export function on(type: 'poke' | 'flavor', fn: () => void) {
  bus.addEventListener(type, fn)
  return () => bus.removeEventListener(type, fn)
}

export function setZone(key: 'productOn' | 'storyOn', value: boolean) {
  if (stage[key] === value) return
  stage[key] = value
  stage.listeners.forEach((fn) => fn())
}

export const isSceneActive = () => stage.storyOn || stage.productOn
