import * as THREE from 'three'
import { createNoise3D, createRandom, fbm, smoothstep } from './noise'

/**
 * Sphere-based geometries have duplicated vertices along the UV seam and at the poles.
 * After displacement, averaging normals of co-located vertices removes the visible seam.
 */
export function smoothSeams(geo: THREE.BufferGeometry) {
  geo.computeVertexNormals()
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const map = new Map<string, number[]>()
  const key = (i: number) =>
    `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`
  for (let i = 0; i < pos.count; i++) {
    const k = key(i)
    const list = map.get(k)
    if (list) list.push(i)
    else map.set(k, [i])
  }
  const n = new THREE.Vector3()
  for (const list of map.values()) {
    if (list.length < 2) continue
    n.set(0, 0, 0)
    for (const i of list) n.x += nor.getX(i), n.y += nor.getY(i), n.z += nor.getZ(i)
    n.normalize()
    for (const i of list) nor.setXYZ(i, n.x, n.y, n.z)
  }
  nor.needsUpdate = true
  return geo
}

export type ScoopGeometry = {
  geometry: THREE.BufferGeometry
  /** Surface points (position + normal) for sprinkling inclusions. */
  samples: { p: THREE.Vector3; n: THREE.Vector3 }[]
}

/**
 * A scooped ball of gelato: lumpy body, rolled folds from the scoop,
 * and a ragged skirt where it was pressed into the cup.
 */
export function createScoopGeometry({
  seed = 1,
  detail = 128,
  base,
  ripple,
}: {
  seed?: number
  detail?: number
  base: string
  ripple?: string
}): ScoopGeometry {
  const geo = new THREE.SphereGeometry(1, detail, Math.round(detail * 0.75))
  const noise = createNoise3D(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const dir = new THREE.Vector3(0.35, 0.82, 0.45).normalize()
  const colors = new Float32Array(pos.count * 3)
  const cBase = new THREE.Color(base)
  const cRipple = ripple ? new THREE.Color(ripple) : null
  const cLight = cBase.clone().lerp(new THREE.Color('#ffffff'), 0.22)
  const cDark = cBase.clone().multiplyScalar(0.82)
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const theta = Math.atan2(v.z, v.x)
    let r = 1
    // body
    r += 0.075 * fbm(noise, v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3, 3)
    // rolled folds left by the scoop
    const t = v.dot(dir)
    const warp = 4.2 * fbm(noise, v.x * 1.2, v.y * 1.2 + 4.2, v.z * 1.2, 3)
    const band = Math.abs(Math.sin(t * 11 + warp))
    // folds only in patches, like a real scoop rolled once or twice
    const patch = smoothstep(-0.15, 0.35, noise(v.x * 1.1 + 7, v.y * 1.1, v.z * 1.1))
    const top = smoothstep(-0.45, 0.2, v.y) * (0.35 + 0.65 * patch)
    r += top * (0.022 * band - 0.03 * Math.pow(1 - band, 6))
    // fine creases and creaminess
    r -= 0.018 * Math.pow(1 - Math.abs(noise(v.x * 4.5, v.y * 4.5, v.z * 4.5)), 5)
    r += 0.008 * noise(v.x * 11, v.y * 11, v.z * 11)
    // ragged skirt
    const lipY = -0.56
    const lip = Math.exp(-Math.pow((v.y - lipY) / 0.15, 2))
    r += lip * (0.13 + 0.09 * noise(Math.cos(theta) * 2.2 + seed, Math.sin(theta) * 2.2, 3.1))
    let y = v.y * r * (v.y > 0 ? 0.9 : 1)
    if (y < lipY) y = lipY + (y - lipY) * 0.28
    pos.setXYZ(i, v.x * r, y, v.z * r)

    // vertex colours: soft mottling, ripples for fruit flavours
    const m = fbm(noise, v.x * 2.4 + 9, v.y * 2.4, v.z * 2.4, 3)
    c.copy(cBase).lerp(m > 0 ? cLight : cDark, Math.min(1, Math.abs(m) * 1.6))
    if (cRipple) {
      const rp = Math.sin(v.y * 5 + 3 * fbm(noise, v.x * 1.5, v.y * 1.5, v.z * 1.5 + 2, 3))
      c.lerp(cRipple, smoothstep(0.55, 0.9, rp) * 0.85)
    }
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  smoothSeams(geo)

  // pick inclusion spots on the visible upper part
  const rand = createRandom(seed * 7 + 3)
  const samples: ScoopGeometry['samples'] = []
  const nor = geo.attributes.normal
  for (let k = 0; k < 900 && samples.length < 420; k++) {
    const i = Math.floor(rand() * pos.count)
    if (pos.getY(i) < -0.4) continue
    samples.push({
      p: new THREE.Vector3().fromBufferAttribute(pos, i),
      n: new THREE.Vector3().fromBufferAttribute(nor, i),
    })
  }
  return { geometry: geo, samples }
}

/** Flat swirl of gelato filling an open tub. */
export function createTubSurfaceGeometry(seed = 3, detail = 96) {
  const ring = new THREE.RingGeometry(0, 1, detail, 24)
  const noise = createNoise3D(seed)
  const pos = ring.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const d = Math.hypot(x, y)
    const a = Math.atan2(y, x)
    // spatula-swept swirl rising towards the centre
    const swirl = Math.sin(a * 3 + d * 9 + 2 * noise(x * 2, y * 2, 1)) * 0.035
    const h = (1 - d * d) * 0.32 + swirl * (1 - d) + 0.03 * noise(x * 6, y * 6, 4)
    pos.setZ(i, h * smoothstep(1.02, 0.86, d) + 0.02)
  }
  ring.rotateX(-Math.PI / 2)
  ring.computeVertexNormals()
  return ring
}

/** Lathe from a 2D outline (x = radius, y = height). */
export function lathe(points: [number, number][], segments = 96) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )
}

/** Taller-than-wide strawberry with a slight point. */
export function createStrawberryGeometry(seed = 5) {
  const geo = new THREE.SphereGeometry(1, 48, 36)
  const noise = createNoise3D(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const taper = 0.55 + 0.45 * smoothstep(-1.05, 0.55, v.y)
    const r = 1 + 0.05 * noise(v.x * 2, v.y * 2, v.z * 2)
    let y = v.y * 1.18
    if (y > 0.85) y = 0.85 + (y - 0.85) * 0.4
    pos.setXYZ(i, v.x * taper * r, y * r, v.z * taper * r)
  }
  smoothSeams(geo)
  return geo
}

/** Lemon: ellipsoid with the two little tips. */
export function createLemonGeometry() {
  const geo = new THREE.SphereGeometry(1, 48, 36)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const tip = Math.pow(Math.abs(v.x), 10) * 0.32
    pos.setXYZ(i, v.x * (1.18 + tip), v.y * 0.86, v.z * 0.86)
  }
  smoothSeams(geo)
  return geo
}

/** Hazelnut with its point and pale base, coloured by vertex. */
export function createHazelnutGeometry(seed = 11) {
  const geo = new THREE.SphereGeometry(1, 40, 30)
  const noise = createNoise3D(seed)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const shell = new THREE.Color('#8a5430')
  const stripe = new THREE.Color('#5e3519')
  const cap = new THREE.Color('#d9b98d')
  const c = new THREE.Color()
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const point = v.y > 0 ? 1 - 0.42 * Math.pow(v.y, 2.2) : 1
    let y = v.y * (v.y > 0 ? 1.12 : 0.9)
    if (y < -0.72) y = -0.72 + (y + 0.72) * 0.3
    const r = 1 + 0.025 * noise(v.x * 3, v.y * 3, v.z * 3)
    pos.setXYZ(i, v.x * point * r, y * r, v.z * point * r)
    const a = Math.atan2(v.z, v.x)
    c.copy(shell).lerp(stripe, 0.5 + 0.5 * Math.sin(a * 22 + noise(v.x * 2, v.y * 6, v.z * 2) * 3))
    c.lerp(cap, smoothstep(-0.45, -0.7, v.y))
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  smoothSeams(geo)
  return geo
}

/** Pistachio kernel: green body blushing to purple skin at one end. */
export function createPistachioKernelGeometry(seed = 13) {
  const geo = new THREE.SphereGeometry(1, 36, 28)
  const noise = createNoise3D(seed)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const green = new THREE.Color('#8fa046')
  const skin = new THREE.Color('#6b3a42')
  const c = new THREE.Color()
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = 1 + 0.06 * noise(v.x * 2.5, v.y * 2.5, v.z * 2.5)
    const tip = 1 - 0.25 * smoothstep(0.2, 1, v.x)
    pos.setXYZ(i, v.x * 1.45 * r, v.y * 0.95 * r * tip, v.z * 0.95 * r * tip)
    const blush = smoothstep(-0.2, 0.9, v.x + 0.35 * noise(v.x * 3, v.y * 3, v.z * 3))
    c.copy(green).lerp(skin, blush * 0.85)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  smoothSeams(geo)
  return geo
}

/** Half pistachio shell (open clam). */
export function createShellGeometry() {
  const geo = new THREE.SphereGeometry(1, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5)
  geo.scale(1.55, 0.62, 1.05)
  geo.computeVertexNormals()
  return geo
}

/** Milk / cream droplet. */
export function createDropGeometry() {
  const geo = new THREE.SphereGeometry(1, 40, 30)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = v.y > 0 ? Math.pow(1 - smoothstep(0, 1, v.y), 1.6) * 0.95 + 0.05 : 1
    pos.setXYZ(i, v.x * k, v.y * (v.y > 0 ? 1.55 : 1), v.z * k)
  }
  smoothSeams(geo)
  return geo
}

/** Cured vanilla pod along a gentle curve. */
export function createVanillaPodGeometry(bend = 0.35, length = 2.4) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-length / 2, 0, 0),
    new THREE.Vector3(-length / 4, bend * 0.6, 0.05),
    new THREE.Vector3(0, bend, 0),
    new THREE.Vector3(length / 4, bend * 0.7, -0.06),
    new THREE.Vector3(length / 2, bend * 0.1, 0),
  ])
  const tubular = 96
  const radial = 10
  const geo = new THREE.TubeGeometry(curve, tubular, 0.06, radial, false)
  const pos = geo.attributes.position
  const noise = createNoise3D(21)
  const center = new THREE.Vector3()
  const p = new THREE.Vector3()
  // taper both ends to a point, flatten slightly and wrinkle
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular
    curve.getPointAt(u, center)
    const taper = Math.pow(Math.sin(Math.PI * u), 0.35)
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      p.fromBufferAttribute(pos, k).sub(center).multiplyScalar(taper)
      p.z *= 0.7
      const a = (j / radial) * Math.PI * 2
      p.multiplyScalar(1 + 0.12 * noise(u * 40, Math.cos(a), Math.sin(a)))
      pos.setXYZ(k, center.x + p.x, center.y + p.y, center.z + p.z)
    }
  }
  geo.computeVertexNormals()
  return geo
}
