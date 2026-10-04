import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import type { Flavor, FlavorId } from '../data/flavors'
import { createScoopGeometry } from './geometry'
import { createRandom } from './noise'
import { getGrainTexture } from './textures'

type Inclusion = { count: number; geometry: () => THREE.BufferGeometry; scale: [number, number]; depth: number }

// Little pieces scattered on the surface give each flavour its character.
const INCLUSIONS: Record<FlavorId, Inclusion> = {
  pistacchio: { count: 90, geometry: () => new THREE.DodecahedronGeometry(1, 0), scale: [0.01, 0.024], depth: 0.5 },
  vaniglia: { count: 420, geometry: () => new THREE.SphereGeometry(1, 4, 3), scale: [0.006, 0.011], depth: 0.2 },
  cioccolato: { count: 50, geometry: () => new THREE.BoxGeometry(2, 0.3, 1.2), scale: [0.016, 0.03], depth: 0.35 },
  fragola: { count: 46, geometry: () => new THREE.IcosahedronGeometry(1, 1), scale: [0.016, 0.034], depth: 0.55 },
  limone: { count: 50, geometry: () => new THREE.BoxGeometry(3, 0.25, 0.4), scale: [0.012, 0.022], depth: 0.2 },
  nocciola: { count: 80, geometry: () => new THREE.DodecahedronGeometry(1, 0), scale: [0.01, 0.024], depth: 0.5 },
}

const geometryCache = new Map<string, ReturnType<typeof createScoopGeometry>>()

function getScoop(flavor: Flavor, seed: number, detail: number) {
  const key = `${flavor.id}-${seed}-${detail}`
  if (!geometryCache.has(key)) {
    geometryCache.set(key, createScoopGeometry({ seed, detail, base: flavor.gelato.base, ripple: flavor.gelato.ripple }))
  }
  return geometryCache.get(key)!
}

// one set per flavour, shared by every scoop of that flavour (bounded: six flavours)
const materialCache = new Map<string, { material: THREE.Material; incGeometry: THREE.BufferGeometry; incMaterial: THREE.Material }>()

function getMaterials(flavor: Flavor) {
  let m = materialCache.get(flavor.id)
  if (!m) {
    const base = new THREE.Color(flavor.gelato.base)
    m = {
      material: new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: flavor.gelato.roughness,
        sheen: 1,
        sheenRoughness: 0.42,
        sheenColor: base.clone().lerp(new THREE.Color('#ffffff'), 0.55),
        clearcoat: 0.12,
        clearcoatRoughness: 0.55,
        bumpMap: getGrainTexture(),
        bumpScale: 0.7,
      }),
      incGeometry: INCLUSIONS[flavor.id].geometry(),
      incMaterial: new THREE.MeshStandardMaterial({
        color: flavor.gelato.speck ?? flavor.gelato.base,
        roughness: flavor.id === 'cioccolato' ? 0.35 : 0.6,
      }),
    }
    materialCache.set(flavor.id, m)
  }
  return m
}

/** Build scoop geometries ahead of time, one per idle slot, so swapping flavours never hitches. */
export function prewarmScoops(list: Flavor[], seed: number, detail: number) {
  const queue = [...list]
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120))
  const next = () => {
    const f = queue.shift()
    if (!f) return
    getScoop(f, seed, detail)
    idle(next)
  }
  idle(next)
}

type Props = ThreeElements['group'] & {
  flavor: Flavor
  seed?: number
  detail?: number
}

export function Gelato({ flavor, seed = 1, detail = 128, ...props }: Props) {
  const { geometry, samples } = useMemo(() => getScoop(flavor, seed, detail), [flavor, seed, detail])

  const { material, incGeometry, incMaterial } = useMemo(() => getMaterials(flavor), [flavor])
  const inc = INCLUSIONS[flavor.id]
  const instRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = instRef.current
    if (!mesh) return
    const rand = createRandom(seed * 31 + flavor.id.length)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const count = Math.min(inc.count, samples.length)
    for (let i = 0; i < count; i++) {
      const sample = samples[(i * 7919) % samples.length]
      const size = inc.scale[0] + rand() * (inc.scale[1] - inc.scale[0])
      // lay the piece along the surface, partly sunk in
      q.setFromUnitVectors(up, sample.n)
      e.set(0, rand() * Math.PI * 2, (rand() - 0.5) * 0.6)
      q.multiply(new THREE.Quaternion().setFromEuler(e))
      p.copy(sample.p).addScaledVector(sample.n, -size * inc.depth)
      s.setScalar(size)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
  }, [samples, inc, seed, flavor])

  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} dispose={null} />
      <instancedMesh ref={instRef} args={[incGeometry, incMaterial, inc.count]} frustumCulled={false} dispose={null} />
    </group>
  )
}
