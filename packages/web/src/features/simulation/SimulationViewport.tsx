import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { BoardActor, OceanPlane, PathTrace } from './SimulationScene'
import type { TrajectoryFrame, TrajectoryRide } from './mockTrajectory'
import './SimulationPage.css'

type Props = {
  frame: TrajectoryFrame
  ride?: TrajectoryRide
  progress?: number
  showMarker?: boolean
}

export function SimulationViewport({
  frame,
  ride,
  progress = 1,
  showMarker,
}: Props) {
  const marker = showMarker ?? Boolean(ride)

  return (
    <Canvas shadows className="simulation-page__canvas">
      <color attach="background" args={['#082f49']} />
      <fog attach="fog" args={['#082f49', 18, 55]} />
      <PerspectiveCamera makeDefault position={[10, 8, 14]} fov={45} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[12, 16, 8]}
        intensity={1.1}
        shadow-mapSize={[1024, 1024]}
      />
      <OceanPlane />
      {ride ? <PathTrace ride={ride} progress={progress} /> : null}
      <BoardActor frame={frame} showMarker={marker} />
      <OrbitControls
        makeDefault
        target={[frame.x, frame.y, frame.z]}
        maxPolarAngle={Math.PI * 0.49}
        minDistance={4}
        maxDistance={40}
      />
    </Canvas>
  )
}
