import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { createTubSurfaceGeometry, lathe } from './geometry'
import { getCupLabelTexture, getGrainTexture, getLidTexture, getTubLabelTexture, getWaffleTextures } from './textures'

type GroupProps = ThreeElements['group']

const CUP_TOP = 0.5

/** Glazed paper cup with the Capriso wrap. Gelato sits at y ≈ CUP_TOP. */
export function Cup(props: GroupProps) {
  const parts = useMemo(() => {
    const wall = lathe([
      [0.62, -0.55],
      [0.7, -0.27],
      [0.78, 0.0],
      [0.85, 0.25],
      [0.92, CUP_TOP],
    ])
    const base = lathe([
      [0, -0.6],
      [0.56, -0.6],
      [0.62, -0.55],
    ])
    const inner = lathe([
      [0.6, -0.48],
      [0.9, CUP_TOP],
    ])
    const label = new THREE.MeshPhysicalMaterial({
      map: getCupLabelTexture(),
      roughness: 0.42,
      clearcoat: 0.55,
      clearcoatRoughness: 0.35,
    })
    const paper = new THREE.MeshPhysicalMaterial({ color: '#efe5d4', roughness: 0.5, side: THREE.DoubleSide })
    return { wall, base, inner, label, paper }
  }, [])

  return (
    <group {...props}>
      <mesh geometry={parts.wall} material={parts.label} />
      <mesh geometry={parts.base} material={parts.paper} />
      <mesh geometry={parts.inner} material={parts.paper} />
      <mesh position={[0, CUP_TOP, 0]} rotation={[Math.PI / 2, 0, 0]} material={parts.paper}>
        <torusGeometry args={[0.91, 0.026, 12, 96]} />
      </mesh>
    </group>
  )
}
Cup.top = CUP_TOP

/** Waffle cone. The scoop sits at y ≈ 0.3. */
export function Cone(props: GroupProps) {
  const parts = useMemo(() => {
    const body = lathe(
      [
        [0.02, -1.75],
        [0.18, -1.3],
        [0.36, -0.75],
        [0.54, -0.05],
      ],
      64,
    )
    const rim = lathe(
      [
        [0.5, -0.06],
        [0.6, -0.04],
        [0.62, 0.06],
        [0.6, 0.16],
        [0.5, 0.18],
      ],
      64,
    )
    const waffle = getWaffleTextures()
    const mat = new THREE.MeshPhysicalMaterial({
      map: waffle,
      bumpMap: waffle,
      bumpScale: 3,
      roughness: 0.72,
      sheen: 0.4,
      sheenColor: new THREE.Color('#f2c37e'),
      side: THREE.DoubleSide,
    })
    const rimMat = new THREE.MeshPhysicalMaterial({ color: '#cf954f', roughness: 0.65, bumpMap: getGrainTexture(), bumpScale: 2 })
    return { body, rim, mat, rimMat }
  }, [])
  return (
    <group {...props}>
      <mesh geometry={parts.body} material={parts.mat} />
      <mesh geometry={parts.rim} material={parts.rimMat} />
    </group>
  )
}

/** Gold tasting spoon. */
export function Spoon(props: GroupProps) {
  const gold = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#d8b067', metalness: 1, roughness: 0.22, clearcoat: 0.4 }),
    [],
  )
  return (
    <group {...props}>
      <mesh material={gold} scale={[2.1, 1, 0.28]} position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.045, 1.0, 6, 16]} />
      </mesh>
      <mesh material={gold} scale={[1, 0.32, 1.45]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.13, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}

export type TubHandles = { lid: THREE.Group | null }

/** Premium take-away tub with lacquered lid; the lid can open to reveal the gelato. */
export const Tub = forwardRef<THREE.Group, GroupProps & { surfaceColor: string }>(function Tub(
  { surfaceColor, children, ...props },
  lidRef,
) {
  const parts = useMemo(() => {
    const body = lathe(
      [
        [0.84, -0.78],
        [0.88, -0.4],
        [0.92, 0.0],
        [0.96, 0.42],
        [1.0, 0.8],
      ],
      128,
    )
    const base = lathe(
      [
        [0, -0.8],
        [0.82, -0.8],
        [0.84, -0.78],
      ],
      96,
    )
    const inner = lathe(
      [
        [0.82, -0.7],
        [0.98, 0.8],
      ],
      96,
    )
    const label = new THREE.MeshPhysicalMaterial({
      map: getTubLabelTexture(),
      roughness: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
    })
    const paper = new THREE.MeshPhysicalMaterial({ color: '#f0e6d6', roughness: 0.45, side: THREE.DoubleSide })
    const lacquer = new THREE.MeshPhysicalMaterial({ color: '#9c1f33', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide })
    const lidTop = new THREE.MeshPhysicalMaterial({
      map: getLidTexture(),
      side: THREE.DoubleSide,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    })
    const gold = new THREE.MeshPhysicalMaterial({ color: '#d4a85a', metalness: 1, roughness: 0.25 })
    const surface = new THREE.MeshPhysicalMaterial({
      color: surfaceColor,
      roughness: 0.6,
      sheen: 1,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color(surfaceColor).lerp(new THREE.Color('#fff'), 0.5),
      bumpMap: getGrainTexture(),
      bumpScale: 1.5,
    })
    const surfaceGeo = createTubSurfaceGeometry()
    return { body, base, inner, label, paper, lacquer, lidTop, gold, surface, surfaceGeo }
  }, [surfaceColor])

  return (
    <group {...props}>
      <mesh geometry={parts.body} material={parts.label} />
      <mesh geometry={parts.base} material={parts.paper} />
      <mesh geometry={parts.inner} material={parts.paper} />
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} material={parts.paper}>
        <torusGeometry args={[0.99, 0.025, 12, 128]} />
      </mesh>
      <mesh geometry={parts.surfaceGeo} material={parts.surface} position={[0, 0.5, 0]} scale={[0.96, 1, 0.96]} />
      {children}
      {/* lid, pivoting from its back edge */}
      <group ref={lidRef} position={[0, 0.8, -1.04]}>
        <group position={[0, 0, 1.04]}>
          <mesh material={parts.lacquer} position={[0, 0.09, 0]}>
            <cylinderGeometry args={[1.05, 1.05, 0.18, 128, 1, true]} />
          </mesh>
          <mesh material={parts.lidTop} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.05, 128]} />
          </mesh>
          <mesh material={parts.lacquer} position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.035, 0.02, 10, 128]} />
          </mesh>
          <mesh material={parts.gold} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.055, 0.014, 8, 128]} />
          </mesh>
        </group>
      </group>
    </group>
  )
})
