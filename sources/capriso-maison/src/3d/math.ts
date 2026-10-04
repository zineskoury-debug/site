/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * Math.min(dt, 0.1)))

/** Map x from [a, b] to [0, 1], clamped. */
export const range = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)))

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
