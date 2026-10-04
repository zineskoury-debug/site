import * as THREE from 'three'
import { createNoise3D, createRandom } from './noise'

import { SANS, SERIF } from './fonts'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement, srgb = true, repeat = false) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Lathe UVs start facing the camera: shift wraps so a face, not the seam, is in front. */
function centredWrap(t: THREE.CanvasTexture) {
  t.wrapS = THREE.RepeatWrapping
  t.offset.x = 0.25
  return t
}

const cache = new Map<string, THREE.Texture>()
function memo<T extends THREE.Texture>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/** Fine creamy grain used as a bump map on gelato and fruit. */
export function getGrainTexture() {
  return memo('grain', () => {
    const size = 256
    const [c, ctx] = canvas(size, size)
    const noise = createNoise3D(4)
    const img = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // tileable by sampling a torus
        const a = (x / size) * Math.PI * 2
        const b = (y / size) * Math.PI * 2
        const nx = Math.cos(a) * 3
        const ny = Math.sin(a) * 3
        const nz = Math.cos(b) * 3 + Math.sin(b) * 5
        const n = noise(nx * 2, ny * 2, nz * 2) * 0.6 + noise(nx * 6, ny * 6, nz * 6) * 0.4
        const v = Math.round(128 + n * 160)
        const i = (y * size + x) * 4
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const t = toTexture(c, false, true)
    t.repeat.set(4, 3)
    return t
  })
}

/** Cup wrap: cream paper, wine filets and the brand name twice around. */
export function getCupLabelTexture() {
  return memo('cup', () => {
    const [c, ctx] = canvas(2048, 512)
    ctx.fillStyle = '#f3ebdd'
    ctx.fillRect(0, 0, 2048, 512)
    // subtle paper fibre
    const rand = createRandom(9)
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(120,90,60,${rand() * 0.035})`
      ctx.fillRect(rand() * 2048, rand() * 512, 1 + rand() * 2, 1)
    }
    ctx.fillStyle = '#a72438'
    ctx.fillRect(0, 24, 2048, 10)
    ctx.fillRect(0, 44, 2048, 2)
    ctx.fillRect(0, 466, 2048, 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const cx of [512, 1536]) {
      ctx.fillStyle = '#a72438'
      ctx.font = `italic 300 128px ${SERIF}`
      ctx.fillText('Capriso', cx, 230)
      ctx.font = `600 26px ${SANS}`
      ctx.fillStyle = '#5c3a2b'
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '9px'
      ctx.fillText('PASSIONE PER IL GELATO', cx, 340)
      ctx.fillText('·  CASABLANCA  ·', cx, 392)
    }
    // vertical hairlines between the two faces
    ctx.fillStyle = 'rgba(167,36,56,.5)'
    ctx.fillRect(1022, 120, 2, 260)
    ctx.fillRect(2046, 120, 2, 260)
    return centredWrap(toTexture(c))
  })
}

/** Tub wrap: a luxury object, wine band with gold filets. */
export function getTubLabelTexture() {
  return memo('tub', () => {
    const [c, ctx] = canvas(2048, 768)
    ctx.fillStyle = '#f2e9da'
    ctx.fillRect(0, 0, 2048, 768)
    ctx.fillStyle = '#a72438'
    ctx.fillRect(0, 470, 2048, 220)
    ctx.fillStyle = '#d9b26a'
    ctx.fillRect(0, 462, 2048, 4)
    ctx.fillRect(0, 696, 2048, 4)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const ls = ctx as CanvasRenderingContext2D & { letterSpacing: string }
    for (const cx of [512, 1536]) {
      ctx.fillStyle = '#2a1913'
      ls.letterSpacing = '12px'
      ctx.font = `600 30px ${SANS}`
      ctx.fillText('GELATO ARTIGIANALE', cx, 110)
      ls.letterSpacing = '0px'
      ctx.fillStyle = '#a72438'
      ctx.font = `italic 300 190px ${SERIF}`
      ctx.fillText('Capriso', cx, 280)
      ctx.fillStyle = '#f6e6c0'
      ctx.font = `italic 360 84px ${SERIF}`
      ctx.fillText('Pistacchio', cx, 572)
      ls.letterSpacing = '10px'
      ctx.font = `600 24px ${SANS}`
      ctx.fillStyle = '#5c3a2b'
      ctx.fillText('500 ML', cx, 400)
    }
    return centredWrap(toTexture(c))
  })
}

/** Lid top: gold monogram on lacquered wine. */
export function getLidTexture() {
  return memo('lid', () => {
    const [c, ctx] = canvas(1024, 1024)
    ctx.fillStyle = '#9c1f33'
    ctx.fillRect(0, 0, 1024, 1024)
    const g = ctx.createRadialGradient(420, 380, 40, 512, 512, 560)
    g.addColorStop(0, 'rgba(255,255,255,.10)')
    g.addColorStop(1, 'rgba(0,0,0,.18)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1024, 1024)
    ctx.strokeStyle = '#d9b26a'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(512, 512, 400, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(512, 512, 380, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#e2bf7c'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `italic 300 360px ${SERIF}`
    ctx.fillText('C', 512, 500)
    const ls = ctx as CanvasRenderingContext2D & { letterSpacing: string }
    ls.letterSpacing = '14px'
    ctx.font = `600 30px ${SANS}`
    ctx.fillText('CAPRISO', 512, 770)
    return toTexture(c)
  })
}

/** Waffle cone lattice: colour + bump in one canvas pair. */
export function getWaffleTextures() {
  return memo('waffle', () => {
    const size = 512
    const [c, ctx] = canvas(size, size)
    const grad = ctx.createLinearGradient(0, 0, 0, size)
    grad.addColorStop(0, '#d9a35d')
    grad.addColorStop(1, '#c4843f')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(120,62,20,.55)'
    ctx.lineWidth = 9
    const step = size / 8
    for (let i = -8; i <= 16; i++) {
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step + size, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step - size, size)
      ctx.stroke()
    }
    const rand = createRandom(17)
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = `rgba(90,45,10,${rand() * 0.12})`
      ctx.fillRect(rand() * size, rand() * size, 2, 2)
    }
    const t = toTexture(c, true, true)
    t.repeat.set(3, 2)
    return t
  }) as THREE.CanvasTexture
}

/** Lemon slice face: segments, pith and rind. */
export function getLemonSliceTexture() {
  return memo('lemonSlice', () => {
    const [c, ctx] = canvas(512, 512)
    ctx.fillStyle = '#f2cf3a'
    ctx.beginPath()
    ctx.arc(256, 256, 256, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbf3d2'
    ctx.beginPath()
    ctx.arc(256, 256, 232, 0, Math.PI * 2)
    ctx.fill()
    const n = 10
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.04
      const a1 = ((i + 1) / n) * Math.PI * 2 - 0.04
      const g = ctx.createRadialGradient(256, 256, 10, 256, 256, 215)
      g.addColorStop(0, '#f7e27a')
      g.addColorStop(1, '#f0cf3c')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(256 + Math.cos((a0 + a1) / 2) * 16, 256 + Math.sin((a0 + a1) / 2) * 16)
      ctx.arc(256, 256, 214, a0, a1)
      ctx.closePath()
      ctx.fill()
    }
    return toTexture(c)
  })
}

/** Soft round sprite for floating particles. */
export function getDotTexture() {
  return memo('dot', () => {
    const [c, ctx] = canvas(64, 64)
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return toTexture(c)
  })
}

/** Blurred contact shadow, cheaper than a shadow map and softer. */
export function getShadowTexture() {
  return memo('shadow', () => {
    const [c, ctx] = canvas(256, 256)
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(42,25,19,.55)')
    g.addColorStop(0.45, 'rgba(42,25,19,.22)')
    g.addColorStop(1, 'rgba(42,25,19,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return toTexture(c)
  })
}
