import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { flavorById } from '../data/flavors'
import { Gelato } from './Gelato'
import { Ingredients } from './Ingredients'
import { Lighting } from './Lighting'
import { damp, easeInOut, easeOut, range } from './math'
import { isSceneActive, stage } from './stage'
import { getDotTexture, getShadowTexture } from './textures'
import { Cup, Spoon, Tub } from './Vessels'

const PISTACHIO = flavorById('pistacchio')

/** The hero cup: floats, follows the pointer, dissolves into ingredients and reforms. */
function HeroProduct({ narrow, detail }: { narrow: boolean; detail: number }) {
  const root = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const scoop = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const s = useRef({ intro: 0, hero: 0, gather: 0, converge: 0 })

  useFrame((state, dt) => {
    const a = s.current
    a.intro = damp(a.intro, stage.intro, 2.2, dt)
    a.hero = damp(a.hero, stage.hero, 5, dt)
    a.gather = damp(a.gather, stage.gather, 4, dt)
    a.converge = damp(a.converge, stage.converge, 4, dt)
    const t = state.clock.elapsedTime
    const still = stage.reducedMotion ? 0 : 1
    const intro = easeOut(a.intro)

    // cup leaves as the ingredients burst out, comes back as they converge
    const away = easeInOut(range(a.gather, 0.02, 0.32))
    const back = easeInOut(range(a.converge, 0.35, 0.75))
    const presence = Math.max(0, 1 - away) * (1 - back) + back
    const scoopGrow = back > 0 ? easeOut(range(a.converge, 0.55, 0.95)) : 1 - away

    // hero framing vs. transformation framing (smaller, lower, leaving room for the title)
    const base = THREE.MathUtils.lerp(narrow ? 0.72 : 1, narrow ? 0.6 : 0.7, back)
    const baseY = THREE.MathUtils.lerp(narrow ? -0.3 : -0.42, narrow ? -0.55 : -0.56, back)
    const zoom = 1 + a.hero * 0.14 * (1 - back)
    const r = root.current!
    r.visible = presence > 0.01 && stage.storyOn
    r.scale.setScalar(base * zoom * Math.max(0.001, presence * presence) * (0.6 + 0.4 * intro))
    r.position.set(0, baseY + (1 - intro) * -0.8 - a.hero * 0.15 * (1 - back) + (1 - presence) * -0.3, 0)

    tilt.current!.rotation.set(
      0.18 + stage.pointer.y * 0.16 * still + a.hero * 0.12,
      stage.pointer.x * 0.35 * still,
      -stage.pointer.x * 0.05 * still,
    )
    spin.current!.rotation.y = -0.5 + t * 0.16 * still + a.hero * 1.4 + (1 - intro) * -1.2 + back * Math.PI * 2
    spin.current!.position.y = Math.sin(t * 0.8) * 0.04 * still

    scoop.current!.scale.setScalar(Math.max(0.001, scoopGrow))
    const sh = shadow.current!.material as THREE.MeshBasicMaterial
    sh.opacity = 0.9 - Math.sin(t * 0.8) * 0.08 * still
  })

  return (
    <group ref={root}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} renderOrder={-1}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={getShadowTexture()} transparent depthWrite={false} />
      </mesh>
      <group ref={tilt}>
        <group ref={spin}>
          <Cup />
          <group ref={scoop} position={[0, 1.02, 0]}>
            <Gelato flavor={PISTACHIO} seed={2} detail={detail} scale={[0.95, 0.86, 0.95]} />
            <Spoon position={[0.6, 0.34, 0.42]} rotation={[0.45, 0.5, -1.05]} scale={0.8} />
          </group>
        </group>
      </group>
    </group>
  )
}

/** Product section: the tub enters, turns under moving light, opens its lid. */
function ProductTub({ narrow, keyLight }: { narrow: boolean; keyLight: React.RefObject<THREE.DirectionalLight | null> }) {
  const root = useRef<THREE.Group>(null)
  const turn = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const p = useRef(0)
  const warm = useMemo(() => new THREE.Color('#ffd7a8'), [])
  const gold = useMemo(() => new THREE.Color('#fff4df'), [])

  useFrame((state, dt) => {
    p.current = damp(p.current, stage.product, 5, dt)
    const k = p.current
    const r = root.current!
    const L = keyLight.current
    r.visible = stage.productOn
    if (!r.visible) {
      // give the shared key light back to the hero
      if (L && L.userData.moved) {
        L.position.set(4, 6, 5)
        L.color.set('#fff1dc')
        L.intensity = 2.2
        L.userData.moved = false
      }
      return
    }
    const t = state.clock.elapsedTime
    const still = stage.reducedMotion ? 0 : 1
    // k runs from the section entering the top of the screen until it has fully left:
    // ~0.76 is the end of the sticky part, the rest follows the page out.
    const enter = easeOut(range(k, 0, 0.16))
    const rotate = easeInOut(range(k, 0.08, 0.52))
    const open = easeInOut(range(k, 0.46, 0.66))
    const exit = range(k, 0.76, 1)
    const zoom = 1 + easeInOut(range(k, 0.14, 0.5)) * 0.16

    r.position.set(0, -2.8 * (1 - enter) + exit * 3.9 - open * 0.35 + (narrow ? -0.25 : -0.1), 0)
    r.scale.setScalar((narrow ? 0.6 : 0.82) * zoom)
    turn.current!.rotation.set(
      0.12 + open * 0.42 + stage.pointer.y * 0.08 * still,
      -1.1 * (1 - enter) + rotate * Math.PI * 2 + stage.pointer.x * 0.25 * still + Math.sin(t * 0.4) * 0.04 * still,
      0,
    )
    lid.current!.rotation.x = -open * 0.95
    lid.current!.position.y = 0.8 + open * 0.08

    // light sweeps from a low warm side light to a high golden key
    if (L) {
      L.userData.moved = true
      const a = -1.2 + rotate * 2.2
      L.position.set(Math.sin(a) * 6, 2 + rotate * 4, Math.cos(a) * 5)
      L.color.copy(warm).lerp(gold, rotate)
      L.intensity = 1.6 + rotate * 1.4
    }
  })

  return (
    <group ref={root} visible={false}>
      <group ref={turn}>
        <Tub ref={lid} surfaceColor={PISTACHIO.gelato.base} />
      </group>
    </group>
  )
}

/** A few slow, discreet particles (sugar dust in a sunbeam). */
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 9
      p[i * 3 + 1] = (Math.random() - 0.5) * 6
      p[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [count])
  useFrame((_, dt) => {
    if (stage.reducedMotion || !ref.current) return
    ref.current.rotation.y += dt * 0.015
    ref.current.position.y = (ref.current.position.y + dt * 0.05) % 1
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        map={getDotTexture()}
        color="#d9b26a"
        size={0.05}
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function Rig() {
  const { camera } = useThree()
  useFrame((_, dt) => {
    const still = stage.reducedMotion ? 0 : 1
    stage.pointer.x = damp(stage.pointer.x, stage.pointerTarget.x * still, 3, dt)
    stage.pointer.y = damp(stage.pointer.y, stage.pointerTarget.y * still, 3, dt)
    camera.position.x = stage.pointer.x * 0.18
    camera.position.y = stage.pointer.y * 0.12
    camera.lookAt(0, 0, 0)
  })
  return null
}

/** Stop rendering entirely while the 3D zones are off-screen. */
function FrameloopController() {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    const update = () => setFrameloop(isSceneActive() ? 'always' : 'never')
    update()
    stage.listeners.add(update)
    return () => {
      stage.listeners.delete(update)
    }
  }, [setFrameloop])
  return null
}

function Scene({ narrow }: { narrow: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null)
  return (
    <>
      <Rig />
      <FrameloopController />
      <Lighting keyLight={key} />
      <HeroProduct narrow={narrow} detail={narrow ? 80 : 128} />
      <Ingredients narrow={narrow} />
      <ProductTub narrow={narrow} keyLight={key} />
      <Particles count={narrow ? 45 : 120} />
    </>
  )
}

export default function Experience() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, narrow ? 1.5 : 1.75))

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      stage.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      stage.pointerTarget.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Scene narrow={narrow} />
    </Canvas>
  )
}
