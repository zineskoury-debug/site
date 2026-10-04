/**
 * Dev-only photo studio: renders the product stills used by the site from the same 3D models.
 * Open /studio.html?shot=<name> and run `npm run stills` to export them all.
 * Replace the exported files in public/images with real photographs at any time.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { flavorById, type FlavorId } from '../data/flavors'
import { Gelato } from '../3d/Gelato'
import { Piece, useIngredientAssets, type Kind } from '../3d/Ingredients'
import { Lighting } from '../3d/Lighting'
import { getShadowTexture } from '../3d/textures'
import { Cone, Cup, Tub } from '../3d/Vessels'

type Garnish = { kind: Kind; position: [number, number, number]; rotation: [number, number, number]; scale: number }

function Shadow({ y = -0.66, size = 3.2, opacity = 0.85 }: { y?: number; size?: number; opacity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={getShadowTexture()} transparent depthWrite={false} opacity={opacity} />
    </mesh>
  )
}

function Garnishes({ items }: { items: Garnish[] }) {
  const a = useIngredientAssets()
  return (
    <>
      {items.map((g, i) => (
        <group key={i} position={g.position} rotation={g.rotation} scale={g.scale}>
          <Piece kind={g.kind} a={a} />
        </group>
      ))}
    </>
  )
}

function CupWith({ scoops, rotation = -0.35 }: { scoops: { id: FlavorId; p: [number, number, number]; s: number; seed: number }[]; rotation?: number }) {
  return (
    <group rotation={[0, rotation, 0]}>
      <Cup />
      {scoops.map((sc) => (
        <Gelato key={sc.id + sc.seed} flavor={flavorById(sc.id)} seed={sc.seed} detail={192} position={sc.p} scale={[sc.s, sc.s * 0.9, sc.s]} />
      ))}
    </group>
  )
}

const FLAVOR_GARNISH: Record<FlavorId, Garnish[]> = {
  pistacchio: [
    { kind: 'pistachio', position: [1.15, -0.5, 0.5], rotation: [0.2, 0.6, 0.1], scale: 0.26 },
    { kind: 'kernel', position: [-1.1, -0.55, 0.6], rotation: [0.1, 1.2, 0.2], scale: 0.17 },
  ],
  vaniglia: [{ kind: 'vanilla', position: [0.2, -0.6, 0.95], rotation: [1.5, 0, 0.12], scale: 0.85 }],
  cioccolato: [
    { kind: 'chocolate', position: [1.15, -0.45, 0.45], rotation: [-0.9, 0.5, 0.25], scale: 0.42 },
    { kind: 'chocolate', position: [-1.15, -0.52, 0.55], rotation: [-1.35, 0.1, -0.5], scale: 0.32 },
  ],
  fragola: [
    { kind: 'strawberry', position: [1.15, -0.32, 0.5], rotation: [0.15, 0.3, -0.5], scale: 0.32 },
    { kind: 'strawberry', position: [-1.18, -0.45, 0.35], rotation: [-0.2, 1.0, 1.45], scale: 0.24 },
  ],
  limone: [
    { kind: 'lemonSlice', position: [-1.1, -0.55, 0.6], rotation: [1.25, 0, 0.2], scale: 0.38 },
    { kind: 'lemon', position: [1.2, -0.3, 0.2], rotation: [0.1, 0.6, 0.2], scale: 0.38 },
  ],
  nocciola: [
    { kind: 'hazelnut', position: [1.1, -0.45, 0.55], rotation: [0.2, 0.4, 0.15], scale: 0.24 },
    { kind: 'hazelnut', position: [1.45, -0.5, 0.1], rotation: [1.3, 0.2, 0.6], scale: 0.2 },
    { kind: 'hazelnut', position: [-1.15, -0.48, 0.5], rotation: [0.1, 1.4, -0.2], scale: 0.22 },
  ],
}

type Shot = { size: [number, number]; camera: [number, number, number]; target: [number, number, number]; fov?: number; scene: ReactNode }

const flavorShot = (id: FlavorId): Shot => ({
  size: [1000, 1250],
  camera: [0, 1.7, 7.9],
  target: [0, 0.3, 0],
  scene: (
    <>
      <Shadow size={4.2} />
      <CupWith scoops={[{ id, p: [0, 1.02, 0], s: 0.95, seed: 2 + id.length }]} />
      <Garnishes items={FLAVOR_GARNISH[id]} />
    </>
  ),
})

export const SHOTS: Record<string, Shot> = {
  ...Object.fromEntries((['pistacchio', 'vaniglia', 'cioccolato', 'fragola', 'limone', 'nocciola'] as FlavorId[]).map((id) => [`flavor-${id}`, flavorShot(id)])),
  'product-uno': {
    size: [1000, 1250],
    camera: [0, 0.9, 7.6],
    target: [0, -0.3, 0],
    scene: (
      <group rotation={[0, 0, 0.1]} position={[0, -0.1, 0]}>
        <Cone position={[0, -0.25, 0]} />
        <Gelato flavor={flavorById('pistacchio')} seed={4} detail={192} position={[0, 0.25, 0]} scale={[0.66, 0.6, 0.66]} />
      </group>
    ),
  },
  'product-due': {
    size: [1000, 1250],
    camera: [0, 1.7, 6.4],
    target: [0, 0.45, 0],
    scene: (
      <>
        <Shadow size={4} />
        <CupWith
          scoops={[
            { id: 'fragola', p: [-0.36, 0.86, 0.05], s: 0.62, seed: 7 },
            { id: 'vaniglia', p: [0.38, 0.88, -0.05], s: 0.62, seed: 9 },
          ]}
        />
      </>
    ),
  },
  'product-tre': {
    size: [1000, 1250],
    camera: [0, 1.8, 6.8],
    target: [0, 0.6, 0],
    scene: (
      <>
        <Shadow size={4} />
        <CupWith
          scoops={[
            { id: 'cioccolato', p: [-0.36, 0.84, 0.08], s: 0.58, seed: 11 },
            { id: 'nocciola', p: [0.37, 0.84, -0.02], s: 0.58, seed: 13 },
            { id: 'limone', p: [0.0, 1.42, -0.04], s: 0.56, seed: 15 },
          ]}
        />
      </>
    ),
  },
  story: {
    size: [900, 1200],
    camera: [0, 0.6, 7.6],
    target: [0, -0.4, 0],
    scene: (
      <>
        <group rotation={[0.08, 0.5, -0.16]}>
          <Cone position={[0, -0.3, 0]} />
          <Gelato flavor={flavorById('fragola')} seed={6} detail={192} position={[0, 0.2, 0]} scale={[0.66, 0.6, 0.66]} />
        </group>
        <Garnishes items={[{ kind: 'strawberry', position: [0.9, -1.4, 0.8], rotation: [0.3, 0.4, -0.6], scale: 0.28 }]} />
      </>
    ),
  },
  craft: {
    size: [1920, 1080],
    camera: [0, 2.3, 8.4],
    target: [1.2, 0.5, 0],
    fov: 30,
    scene: (
      <>
        <group position={[2.1, -0.2, 0]}>
          <Shadow size={4.4} opacity={1} />
          <CupWith scoops={[{ id: 'pistacchio', p: [0, 1.02, 0], s: 0.95, seed: 2 }]} rotation={-0.6} />
        </group>
        <Garnishes
          items={[
            { kind: 'pistachio', position: [0.75, -0.6, 1.2], rotation: [0.2, 0.6, 0.1], scale: 0.24 },
            { kind: 'kernel', position: [1.25, -0.62, 1.85], rotation: [0.1, 1.9, 0.2], scale: 0.15 },
            { kind: 'kernel', position: [3.5, -0.6, 1.1], rotation: [0.2, 0.4, 0.1], scale: 0.15 },
            { kind: 'pistachio', position: [3.4, -0.6, -0.5], rotation: [0.1, 2.2, 0.1], scale: 0.22 },
            { kind: 'vanilla', position: [2.3, -0.64, 1.75], rotation: [1.55, 0, 0.25], scale: 0.85 },
            { kind: 'drop', position: [0.9, -0.6, 0.2], rotation: [0, 0, 0], scale: 0.09 },
          ]}
        />
      </>
    ),
  },
  hero: {
    size: [1200, 1200],
    camera: [0, 0.8, 6.8],
    target: [0, 0.35, 0],
    scene: (
      <>
        <Shadow />
        <group rotation={[0, -0.5, 0]}>
          <Cup />
          <Gelato flavor={flavorById('pistacchio')} seed={2} detail={192} position={[0, 1.02, 0]} scale={[0.95, 0.86, 0.95]} />
        </group>
      </>
    ),
  },
  tub: {
    size: [1100, 1200],
    camera: [0, 2.4, 6.4],
    target: [0, 0.2, 0],
    scene: <OpenTub />,
  },
}

function OpenTub() {
  const lid = useRef<THREE.Group>(null)
  useEffect(() => {
    if (lid.current) {
      lid.current.rotation.x = -1.0
      lid.current.position.y = 0.95
    }
  }, [])
  return (
    <group rotation={[0, -0.4, 0]} scale={0.9}>
      <Tub ref={lid} surfaceColor={flavorById('pistacchio').gelato.base} />
    </group>
  )
}

function CameraSetup({ shot }: { shot: Shot }) {
  const { camera } = useThree()
  const frames = useRef(0)
  useEffect(() => {
    camera.position.set(...shot.camera)
    if ('fov' in camera && shot.fov) {
      ;(camera as THREE.PerspectiveCamera).fov = shot.fov
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
    camera.lookAt(...shot.target)
  }, [camera, shot])
  useFrame(() => {
    if (++frames.current === 20) (window as unknown as { __ready: boolean }).__ready = true
  })
  return null
}

export function Studio() {
  const name = new URLSearchParams(location.search).get('shot') ?? 'hero'
  const shot = SHOTS[name]
  if (!shot) return <p>Unknown shot: {name}. Available: {Object.keys(SHOTS).join(', ')}</p>
  return (
    <div style={{ width: shot.size[0], height: shot.size[1] }}>
      <Canvas
        dpr={window.devicePixelRatio}
        camera={{ position: shot.camera, fov: shot.fov ?? 30 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraSetup shot={shot} />
        <Lighting />
        {shot.scene}
      </Canvas>
    </div>
  )
}
