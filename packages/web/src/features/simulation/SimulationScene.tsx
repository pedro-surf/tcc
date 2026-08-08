import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { TrajectoryFrame, TrajectoryRide } from './mockTrajectory'

function createSurfboardGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -1.2)
  shape.quadraticCurveTo(0.45, -0.6, 0.5, 0)
  shape.quadraticCurveTo(0.45, 0.8, 0, 1.35)
  shape.quadraticCurveTo(-0.45, 0.8, -0.5, 0)
  shape.quadraticCurveTo(-0.45, -0.6, 0, -1.2)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.05,
    bevelSegments: 6,
  })
  geometry.center()
  // Board length along Z for heading along +X after rotation
  geometry.rotateX(-Math.PI / 2)
  geometry.rotateY(Math.PI / 2)
  return geometry
}

type BoardActorProps = {
  frame: TrajectoryFrame
}

export function BoardActor({ frame }: BoardActorProps) {
  const group = useRef<THREE.Group>(null!)
  const geometry = useMemo(() => createSurfboardGeometry(), [])

  useFrame(() => {
    if (!group.current) return
    group.current.position.set(frame.x, frame.y, frame.z)
    group.current.rotation.set(frame.pitch, frame.yaw, frame.roll, 'YXZ')
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0.55, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.2, 10]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>

      <Html
        position={[0, 0.85, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="sim-board-marker">
          <div className="sim-board-marker__title">Board</div>
          <div>
            <span>Dist</span> {frame.distance.toFixed(1)} m
          </div>
          <div>
            <span>Speed</span> {(frame.speed * 3.6).toFixed(1)} km/h
          </div>
          <div>
            <span>Height</span> {frame.height.toFixed(2)} m
          </div>
        </div>
      </Html>
    </group>
  )
}

type PathTraceProps = {
  ride: TrajectoryRide
  progress: number
}

export function PathTrace({ ride, progress }: PathTraceProps) {
  const points = useMemo(
    () =>
      ride.frames.map(
        (f) => [f.x, f.y + 0.03, f.z] as [number, number, number],
      ),
    [ride.frames],
  )

  const endIndex = Math.max(
    2,
    Math.min(
      points.length,
      Math.floor(progress * (points.length - 1)) + 1,
    ),
  )
  const traveled = points.slice(0, endIndex)
  const remaining = points.slice(Math.max(0, endIndex - 1))

  return (
    <>
      {remaining.length > 1 ? (
        <Line
          points={remaining}
          color="#94a3b8"
          lineWidth={1.5}
          transparent
          opacity={0.35}
        />
      ) : null}
      {traveled.length > 1 ? (
        <Line points={traveled} color="#0384c6" lineWidth={3} />
      ) : null}
    </>
  )
}

export function OceanPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 30, 1, 1]} />
      <meshStandardMaterial color="#0c4a6e" roughness={0.85} metalness={0.05} />
    </mesh>
  )
}
