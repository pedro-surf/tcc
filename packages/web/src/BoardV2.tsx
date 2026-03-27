import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import type { Sample } from './types'

/* ---------- PRANCHA PROCEDURAL ---------- */

function createSurfboardGeometry() {
  const shape = new THREE.Shape()

  // eixo Y = comprimento da prancha
  shape.moveTo(0, -1.2) // tail
  shape.quadraticCurveTo(0.45, -0.6, 0.5, 0)
  shape.quadraticCurveTo(0.45, 0.8, 0, 1.35) // nose
  shape.quadraticCurveTo(-0.45, 0.8, -0.5, 0)
  shape.quadraticCurveTo(-0.45, -0.6, 0, -1.2)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.05,
    bevelSegments: 6
  })

  geometry.center()
  return geometry
}

/* ---------- BOARD ---------- */

function Board({ sample }: { sample?: Sample }) {
  const ref = useRef<THREE.Mesh>(null!)

  const geometry = useMemo(() => createSurfboardGeometry(), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f5f5f4',
        roughness: 0.4,
        metalness: 0.1
      }),
    []
  )

  useFrame(() => {
    if (!sample) return

    // conversão simples (placeholder)
    // futuramente: Madgwick / filtro complementar
    ref.current.rotation.x = sample.gx * 0.01
    ref.current.rotation.y = sample.gy * 0.01
    ref.current.rotation.z = sample.gz * 0.01
  })

  return <mesh ref={ref} geometry={geometry} material={material} />
}

/* ---------- CENA ---------- */

export function Board3D({ sample }: { sample?: Sample }) {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 3.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Luz ambiente */}
      <ambientLight intensity={0.6} />

      {/* Luz principal */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* Luz de preenchimento */}
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />

      {/* Prancha */}
      <Board sample={sample} />
    </Canvas>
  )
}
