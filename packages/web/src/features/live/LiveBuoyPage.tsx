import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../graphql/client'
import type { Sample } from '../../types'
import {
  type TrajectoryFrame,
} from '../simulation/mockTrajectory'
import { SimulationViewport } from '../simulation/SimulationViewport'

type LiveSample = Sample & {
  device: string
  mx: number
  my: number
  mz: number
  pressure: number
  temperature: number
}

type Snapshot = {
  mqtt: boolean
  samples: LiveSample[]
}

const MAX_POINTS = 300
const REST_POSE: TrajectoryFrame = {
  t: 0,
  x: 6,
  y: 0.22,
  z: 0,
  pitch: 0,
  roll: 0,
  yaw: 0,
  speed: 0,
  height: 0.22,
  distance: 0,
}

function accelToTilt(sample: LiveSample) {
  return {
    roll: Math.atan2(sample.ay, sample.az),
    pitch: Math.atan2(-sample.ax, Math.hypot(sample.ay, sample.az)),
  }
}

export function LiveBuoyPage() {
  const [samples, setSamples] = useState<LiveSample[]>([])
  const [mqtt, setMqtt] = useState(false)
  const [streamOk, setStreamOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const filter = useRef({ roll: 0, pitch: 0, yaw: 0, tSec: 0, primed: false })

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/live/buoy/stream`)

    source.addEventListener('snapshot', (event) => {
      const body = JSON.parse((event as MessageEvent).data) as Snapshot
      setMqtt(body.mqtt)
      setSamples(body.samples.slice(-MAX_POINTS))
      setStreamOk(true)
      setError(null)
    })

    source.addEventListener('sample', (event) => {
      const sample = JSON.parse((event as MessageEvent).data) as LiveSample
      setSamples((prev) => [...prev, sample].slice(-MAX_POINTS))
      setStreamOk(true)
    })

    source.onerror = () => {
      setStreamOk(false)
      setError('Lost live stream — is the backend running on :3000?')
    }

    return () => source.close()
  }, [])

  const latest = samples.at(-1)

  const frame = useMemo(() => {
    if (!latest) return REST_POSE

    const tilt = accelToTilt(latest)
    const state = filter.current
    const tSec = latest.timestamp / 1000
    const dt = state.primed
      ? Math.min(0.25, Math.max(0.02, tSec - state.tSec || 0.1))
      : 0.1
    const toRad = Math.PI / 180
    const alpha = 0.96

    state.roll = alpha * (state.roll + latest.gx * toRad * dt) + (1 - alpha) * tilt.roll
    state.pitch =
      alpha * (state.pitch + latest.gy * toRad * dt) + (1 - alpha) * tilt.pitch
    state.yaw += latest.gz * toRad * dt
    state.tSec = tSec
    state.primed = true

    return {
      t: tSec,
      x: REST_POSE.x,
      y: REST_POSE.y,
      z: REST_POSE.z,
      pitch: state.pitch,
      roll: state.roll,
      yaw: state.yaw,
      speed: Math.hypot(latest.gx, latest.gy, latest.gz) * (Math.PI / 180),
      height: REST_POSE.y,
      distance: 0,
    } satisfies TrajectoryFrame
  }, [latest])

  return (
    <div className="simulation-page">
      <SimulationViewport frame={frame} showMarker={false} />

      <header className="simulation-page__top">
        <Link to="/" className="simulation-page__back">
          ← Back
        </Link>
        <div>
          <h1>Live buoy</h1>
          <p>
            {streamOk ? 'Streaming from backend' : 'Connecting…'}
            {mqtt ? ' · MQTT up' : ' · MQTT down'}
            {latest ? ` · ${latest.device}` : ''}
          </p>
          {error ? <p>{error}</p> : null}
        </div>
      </header>

      <aside className="simulation-page__hud">
        <div>
          <span>Accel</span>
          <strong>
            {latest
              ? `${latest.ax.toFixed(2)} ${latest.ay.toFixed(2)} ${latest.az.toFixed(2)}`
              : '—'}
          </strong>
        </div>
        <div>
          <span>Gyro</span>
          <strong>
            {latest
              ? `${latest.gx.toFixed(1)} ${latest.gy.toFixed(1)} ${latest.gz.toFixed(1)}`
              : '—'}
          </strong>
        </div>
        <div>
          <span>Mag</span>
          <strong>
            {latest
              ? `${latest.mx.toFixed(0)} ${latest.my.toFixed(0)} ${latest.mz.toFixed(0)}`
              : '—'}
          </strong>
        </div>
        <div>
          <span>P / T</span>
          <strong>
            {latest
              ? `${latest.pressure.toFixed(0)} Pa / ${latest.temperature.toFixed(1)} °C`
              : '—'}
          </strong>
        </div>
      </aside>
    </div>
  )
}
