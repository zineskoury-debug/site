import type { RefObject } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import type * as THREE from 'three'

/** Soft studio light: warm key, cool fill, rim, and a baked environment for reflections. */
export function Lighting({ keyLight, intensity = 1 }: { keyLight?: RefObject<THREE.DirectionalLight | null>; intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#fff3e2" />
      <directionalLight ref={keyLight} position={[4, 6, 5]} intensity={2.2 * intensity} color="#fff1dc" />
      <directionalLight position={[-5, 2.5, -4]} intensity={1.3} color="#ffcfa0" />
      <directionalLight position={[0, -3, 3]} intensity={0.25} color="#f5d9c0" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e0" position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe2c2" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fff" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffd6a0" position={[0, 1, -6]} scale={4} />
      </Environment>
    </>
  )
}
