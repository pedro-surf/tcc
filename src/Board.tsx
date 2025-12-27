import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Sample } from './types'
import { useRef } from 'react'

function Board({ sample }: { sample?: Sample }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (!sample) return

    // gyro bruto → rotação simples (placeholder)
    ref.current.rotation.x = sample.gx * 0.01
    ref.current.rotation.y = sample.gy * 0.01
    ref.current.rotation.z = sample.gz * 0.01
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 0.2, 0.5]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  )
}

export function Board3D({ sample }: { sample?: Sample }) {
  return (
    <Canvas camera={{ position: [0, 2, 5] }}>
      <ambientLight />
      <directionalLight position={[5, 5, 5]} />
      <Board sample={sample} />
    </Canvas>
  )
}
