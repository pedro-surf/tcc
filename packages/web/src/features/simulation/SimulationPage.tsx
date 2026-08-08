import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  generateMockTrajectory,
  sampleTrajectory,
} from './mockTrajectory'
import { BoardActor, OceanPlane, PathTrace } from './SimulationScene'
import './SimulationPage.css'

export function SimulationPage() {
  const ride = useMemo(() => generateMockTrajectory(18, 30), [])
  const [playing, setPlaying] = useState(true)
  const [timeSec, setTimeSec] = useState(0)
  const [speed, setSpeed] = useState(1)
  const lastTs = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) {
      lastTs.current = null
      return
    }

    let raf = 0
    const tick = (now: number) => {
      if (lastTs.current == null) lastTs.current = now
      const dt = (now - lastTs.current) / 1000
      lastTs.current = now
      setTimeSec((prev) => {
        const next = prev + dt * speed
        if (next >= ride.durationSec) {
          setPlaying(false)
          return ride.durationSec
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, ride.durationSec, speed])

  const frame = useMemo(
    () => sampleTrajectory(ride, timeSec),
    [ride, timeSec],
  )
  const progress = ride.durationSec > 0 ? timeSec / ride.durationSec : 0

  return (
    <div className="simulation-page">
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
        <PathTrace ride={ride} progress={progress} />
        <BoardActor frame={frame} />
        <OrbitControls
          makeDefault
          target={[frame.x, frame.y, frame.z]}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={4}
          maxDistance={40}
        />
      </Canvas>

      <header className="simulation-page__top">
        <Link to="/" className="simulation-page__back">
          ← Back
        </Link>
        <div>
          <h1>{ride.label}</h1>
          <p>Fullscreen trajectory replay with path trace</p>
        </div>
      </header>

      <aside className="simulation-page__hud">
        <div>
          <span>Distance</span>
          <strong>{frame.distance.toFixed(1)} m</strong>
        </div>
        <div>
          <span>Speed</span>
          <strong>{(frame.speed * 3.6).toFixed(1)} km/h</strong>
        </div>
        <div>
          <span>Height</span>
          <strong>{frame.height.toFixed(2)} m</strong>
        </div>
        <div>
          <span>Time</span>
          <strong>
            {timeSec.toFixed(1)}s / {ride.durationSec.toFixed(0)}s
          </strong>
        </div>
      </aside>

      <footer className="simulation-page__timeline">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (timeSec >= ride.durationSec) setTimeSec(0)
            setPlaying((p) => !p)
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setPlaying(false)
            setTimeSec(0)
          }}
        >
          Reset
        </button>
        <label className="simulation-page__scrub">
          <span>Timeline</span>
          <input
            type="range"
            min={0}
            max={ride.durationSec}
            step={0.01}
            value={timeSec}
            onChange={(e) => {
              setPlaying(false)
              setTimeSec(Number(e.target.value))
            }}
          />
        </label>
        <label className="simulation-page__rate">
          <span>Rate</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
      </footer>
    </div>
  )
}

export default SimulationPage
