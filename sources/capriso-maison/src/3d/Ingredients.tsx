import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import {
  createDropGeometry,
  createHazelnutGeometry,
  createLemonGeometry,
  createPistachioKernelGeometry,
  createShellGeometry,
  createStrawberryGeometry,
  createVanillaPodGeometry,
} from './geometry'
import { createRandom } from './noise'
import { stage } from './stage'
import { getGrainTexture, getLemonSliceTexture } from './textures'
import { damp, easeInOut, range } from './math'

export type Kind = 'strawberry' | 'lemon' | 'lemonSlice' | 'pistachio' | 'kernel' | 'vanilla' | 'chocolate' | 'hazelnut' | 'drop'

export type IngredientSpec = {
  kind: Kind
  /** Home position in viewport units: x, y in [-1, 1], z in world units. */
  home: [number, number, number]
  /** Home position on narrow screens. */
  homeMobile?: [number, number, number]
  scale: number
  rot: [number, number, number]
  /** Index into the annotation list, if this piece carries a caption. */
  label?: number
  /** Hidden on small screens to keep things light. */
  desktopOnly?: boolean
}

// Composition: generous right side for the objects, left side for the copy.
export const INGREDIENTS: IngredientSpec[] = [
  { kind: 'pistachio', home: [0.18, 0.5, 0.4], homeMobile: [-0.55, -0.05, 0.2], scale: 0.32, rot: [0.4, 0.6, 0.2], label: 0 },
  { kind: 'kernel', home: [0.34, 0.66, -0.4], homeMobile: [-0.2, 0.08, -0.4], scale: 0.2, rot: [0.2, 1.2, 0.5] },
  { kind: 'strawberry', home: [0.62, 0.38, 0.6], homeMobile: [0.5, -0.12, 0.5], scale: 0.38, rot: [0.3, 0.2, -0.35], label: 1 },
  { kind: 'strawberry', home: [0.88, 0.7, -1.2], scale: 0.3, rot: [-0.4, 1.6, 0.5], desktopOnly: true },
  { kind: 'lemon', home: [0.86, -0.08, -0.3], homeMobile: [0.45, -0.52, -0.2], scale: 0.42, rot: [0.2, 0.8, 0.35], label: 2 },
  { kind: 'lemonSlice', home: [0.56, -0.18, 1.0], scale: 0.36, rot: [1.1, 0.2, 0.4], desktopOnly: true },
  { kind: 'vanilla', home: [0.3, 0.06, 0.2], homeMobile: [-0.05, -0.32, 0.2], scale: 0.62, rot: [0.3, 0.2, 0.55], label: 3 },
  { kind: 'vanilla', home: [0.42, -0.04, -0.6], scale: 0.55, rot: [0.6, 2.2, -0.3], desktopOnly: true },
  { kind: 'chocolate', home: [0.24, -0.58, 0.5], homeMobile: [-0.55, -0.62, 0.3], scale: 0.42, rot: [-0.35, 0.4, 0.3], label: 4 },
  { kind: 'chocolate', home: [0.08, -0.38, -0.9], scale: 0.32, rot: [-0.6, -0.5, 1.1], desktopOnly: true },
  { kind: 'hazelnut', home: [0.66, -0.62, 0.2], homeMobile: [0.1, -0.78, 0.2], scale: 0.24, rot: [0.3, 0.3, 0.2], label: 5 },
  { kind: 'hazelnut', home: [0.84, -0.44, -0.8], scale: 0.2, rot: [1.2, 0.3, 0.8], desktopOnly: true },
  { kind: 'drop', home: [0.5, 0.72, 0.3], homeMobile: [0.62, 0.22, 0.3], scale: 0.17, rot: [0.2, 0, 0.25], label: 6 },
  { kind: 'drop', home: [0.06, 0.2, -1.2], scale: 0.12, rot: [-0.3, 0, -0.4], desktopOnly: true },
  { kind: 'drop', home: [0.96, 0.16, 0.8], scale: 0.1, rot: [0.1, 0, 0.6], desktopOnly: true },
]

export const LABEL_COUNT = 7

export function useIngredientAssets() {
  return useMemo(() => {
    const grain = getGrainTexture()
    return {
      strawberry: createStrawberryGeometry(),
      lemon: createLemonGeometry(),
      kernel: createPistachioKernelGeometry(),
      shell: createShellGeometry(),
      hazelnut: createHazelnutGeometry(),
      drop: createDropGeometry(),
      vanilla: createVanillaPodGeometry(),
      seed: new THREE.SphereGeometry(1, 6, 4),
      leaf: (() => {
        const g = new THREE.ConeGeometry(0.16, 0.62, 5, 1)
        g.translate(0, 0.31, 0)
        g.scale(1, 1, 0.22)
        return g
      })(),
      mat: {
        strawberry: new THREE.MeshPhysicalMaterial({ color: '#d42a3a', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2, bumpMap: grain, bumpScale: 0.8 }),
        seed: new THREE.MeshStandardMaterial({ color: '#f3d36b', roughness: 0.5 }),
        leaf: new THREE.MeshStandardMaterial({ color: '#4d7a2a', roughness: 0.6, side: THREE.DoubleSide }),
        lemon: new THREE.MeshPhysicalMaterial({ color: '#f1c52c', roughness: 0.42, clearcoat: 0.5, bumpMap: grain, bumpScale: 2.5 }),
        lemonRind: new THREE.MeshPhysicalMaterial({ color: '#f1c52c', roughness: 0.45 }),
        lemonFace: new THREE.MeshPhysicalMaterial({ map: getLemonSliceTexture(), roughness: 0.25, clearcoat: 0.6 }),
        kernel: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#d9e2a8') }),
        shell: new THREE.MeshPhysicalMaterial({ color: '#dcc6a0', roughness: 0.7, side: THREE.DoubleSide, bumpMap: grain, bumpScale: 1.2 }),
        hazelnut: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
        drop: new THREE.MeshPhysicalMaterial({ color: '#fbf6ec', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3 }),
        vanilla: new THREE.MeshPhysicalMaterial({ color: '#2e1c12', roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, bumpMap: grain, bumpScale: 2 }),
        chocolate: new THREE.MeshPhysicalMaterial({ color: '#3d2016', roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.2 }),
      },
    }
  }, [])
}

type Assets = ReturnType<typeof useIngredientAssets>

function StrawberrySeeds({ a }: { a: Assets }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current!
    const pos = a.strawberry.attributes.position
    const nor = a.strawberry.attributes.normal
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const rand = createRandom(3)
    let k = 0
    for (let tries = 0; tries < 1000 && k < 90; tries++) {
      const i = Math.floor(rand() * pos.count)
      p.fromBufferAttribute(pos, i)
      if (p.y > 0.75) continue
      n.fromBufferAttribute(nor, i)
      q.setFromUnitVectors(up, n)
      m.compose(p.addScaledVector(n, -0.01), q, new THREE.Vector3(0.025, 0.045, 0.025))
      mesh.setMatrixAt(k++, m)
    }
    mesh.count = k
    mesh.instanceMatrix.needsUpdate = true
  }, [a])
  return <instancedMesh ref={ref} args={[a.seed, a.mat.seed, 90]} frustumCulled={false} />
}

export function Piece({ kind, a }: { kind: Kind; a: Assets }) {
  switch (kind) {
    case 'strawberry':
      return (
        <group>
          <mesh geometry={a.strawberry} material={a.mat.strawberry} />
          <StrawberrySeeds a={a} />
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              geometry={a.leaf}
              material={a.mat.leaf}
              position={[0, 1.02, 0]}
              rotation={[0, (i / 6) * Math.PI * 2, 1.25]}
            />
          ))}
          <mesh material={a.mat.leaf} position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.32, 6]} />
          </mesh>
        </group>
      )
    case 'lemon':
      return <mesh geometry={a.lemon} material={a.mat.lemon} />
    case 'lemonSlice':
      return (
        <mesh material={[a.mat.lemonRind, a.mat.lemonFace, a.mat.lemonFace]}>
          <cylinderGeometry args={[1, 1, 0.16, 64]} />
        </mesh>
      )
    case 'pistachio':
      return (
        <group>
          <mesh geometry={a.shell} material={a.mat.shell} rotation={[Math.PI, 0, 0]} position={[0, -0.05, 0]} />
          <mesh geometry={a.kernel} material={a.mat.kernel} scale={0.92} position={[0, 0.12, 0]} />
        </group>
      )
    case 'kernel':
      return <mesh geometry={a.kernel} material={a.mat.kernel} />
    case 'vanilla':
      return <mesh geometry={a.vanilla} material={a.mat.vanilla} />
    case 'chocolate':
      return (
        <group>
          <RoundedBox args={[1, 1, 0.26]} radius={0.05} smoothness={3} material={a.mat.chocolate} />
          <RoundedBox args={[0.74, 0.74, 0.16]} radius={0.06} smoothness={3} position={[0, 0, 0.12]} material={a.mat.chocolate} />
        </group>
      )
    case 'hazelnut':
      return <mesh geometry={a.hazelnut} material={a.mat.hazelnut} />
    case 'drop':
      return <mesh geometry={a.drop} material={a.mat.drop} />
  }
}

/**
 * Ingredients burst out of the cup (gather), float, then flow back into it (converge).
 * Labelled pieces publish their screen position so the DOM can draw captions next to them.
 */
export function Ingredients({ narrow }: { narrow: boolean }) {
  const a = useIngredientAssets()
  const { viewport, camera, size } = useThree()
  const items = useMemo(() => INGREDIENTS.filter((s) => !(narrow && s.desktopOnly)), [narrow])
  const refs = useRef<(THREE.Group | null)[]>([])
  const phases = useMemo(() => items.map((_, i) => createRandom(i + 1)() * Math.PI * 2), [items])
  const anim = useRef({ gather: 0, converge: 0 })
  const v = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    stage.labels = Array.from({ length: LABEL_COUNT }, () => ({ x: 0, y: 0, visible: 0 }))
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const still = stage.reducedMotion
    anim.current.gather = damp(anim.current.gather, stage.gather, 4, dt)
    anim.current.converge = damp(anim.current.converge, stage.converge, 4, dt)
    const g = anim.current.gather
    const c = anim.current.converge
    const vw = viewport.getCurrentViewport(camera, [0, 0, 0]).width / 2
    const vh = viewport.getCurrentViewport(camera, [0, 0, 0]).height / 2
    for (const l of stage.labels) l.visible = 0

    items.forEach((spec, i) => {
      const obj = refs.current[i]
      if (!obj) return
      const home = narrow && spec.homeMobile ? spec.homeMobile : spec.home
      // staggered timing per piece
      const stagger = (i / items.length) * 0.35
      const out = easeInOut(range(g, stagger, stagger + 0.65))
      const back = easeInOut(range(c, 0.05 + stagger * 0.6, 0.55 + stagger * 0.6))
      const visible = out * (1 - back)
      obj.visible = visible > 0.002 && stage.storyOn
      if (!obj.visible) return

      const hx = home[0] * vw
      const hy = home[1] * vh
      const float = still ? 0 : 1
      // from the cup (centre) to home, then back into the cup (slightly above it)
      const x0 = THREE.MathUtils.lerp(0, hx, out)
      const y0 = THREE.MathUtils.lerp(-0.2, hy, out)
      const z0 = THREE.MathUtils.lerp(0, home[2], out)
      obj.position.set(
        THREE.MathUtils.lerp(x0, 0, back) + Math.sin(t * 0.5 + phases[i]) * 0.05 * float - stage.pointer.x * home[2] * 0.12,
        THREE.MathUtils.lerp(y0, 0.55, back) + Math.cos(t * 0.6 + phases[i]) * 0.07 * float + stage.pointer.y * home[2] * 0.08,
        THREE.MathUtils.lerp(z0, 0, back),
      )
      const spin = (1 - out) * 3 + back * 4
      obj.rotation.set(
        spec.rot[0] + Math.sin(t * 0.3 + phases[i]) * 0.2 * float + spin,
        spec.rot[1] + t * 0.12 * float + spin,
        spec.rot[2],
      )
      obj.scale.setScalar(spec.scale * (narrow ? 0.8 : 1) * Math.min(1, visible * 1.4))

      if (spec.label !== undefined && !narrow) {
        v.copy(obj.position).project(camera)
        const l = stage.labels[spec.label]
        l.x = (v.x * 0.5 + 0.5) * size.width
        l.y = (-v.y * 0.5 + 0.5) * size.height
        l.visible = range(g, 0.75, 1) * (1 - range(c, 0, 0.2))
      }
    })
  })

  return (
    <group>
      {items.map((spec, i) => (
        <group key={i} ref={(el) => {
            refs.current[i] = el
          }} visible={false}>
          <Piece kind={spec.kind} a={a} />
        </group>
      ))}
    </group>
  )
}
