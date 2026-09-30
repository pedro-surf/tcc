import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../graphql/client'
import type { Sample } from '../../types'
import {
  type TrajectoryFrame,
} from '../simulation/mockTrajectory'
import { SimulationViewport } from '../simulation/SimulationViewport'
import { LiveMiniMap } from './LiveMiniMap'
import { MqttLogModal, type MqttLogLine } from './MqttLogModal'
import {
  createKalmanAttitude,
  stepKalman,
  type KalmanAttitude,
} from './kalmanAttitude'
import { flipChipAttitude, flipImuSample } from './imuMount'

type LiveSample = Sample & {
  device: string
  mx: number
  my: number
  mz: number
  pressure: number
  temperature: number
  roll?: number
  pitch?: number
  yaw?: number
}

type Snapshot = {
  mqtt: boolean
  samples: LiveSample[]
  logs?: MqttLogLine[]
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

const RAD_TO_DEG = 180 / Math.PI

type AttitudeRuntime = {
  attitude: KalmanAttitude
  armed: boolean
  lastTs: number | null
  stepUs: number
  jitter: number
  prevRoll: number
  prevPitch: number
  havePose: boolean
  source: 'kalman' | 'device'
  mount: boolean
}

function accelToTilt(sample: LiveSample) {
  return {
    roll: Math.atan2(sample.ay, sample.az),
    pitch: Math.atan2(-sample.ax, Math.hypot(sample.ay, sample.az)),
  }
}

function angleDelta(next: number, prev: number) {
  let delta = next - prev
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return Math.abs(delta)
}

function formatRpy(roll: number, pitch: number, yaw: number) {
  return `${(roll * RAD_TO_DEG).toFixed(1)} ${(pitch * RAD_TO_DEG).toFixed(1)} ${(yaw * RAD_TO_DEG).toFixed(1)}`
}

export function LiveBuoyPage() {
  const [samples, setSamples] = useState<LiveSample[]>([])
  const [mqtt, setMqtt] = useState(false)
  const [streamOk, setStreamOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useKalman, setUseKalman] = useState(true)
  const [upsideDown, setUpsideDown] = useState(true)
  const [logs, setLogs] = useState<MqttLogLine[]>([])
  const [logOpen, setLogOpen] = useState(false)
  const filter = useRef({ roll: 0, pitch: 0, yaw: 0, tSec: 0, primed: false })
  const runtime = useRef<AttitudeRuntime>({
    attitude: createKalmanAttitude(),
    armed: false,
    lastTs: null,
    stepUs: 0,
    jitter: 0,
    prevRoll: 0,
    prevPitch: 0,
    havePose: false,
    source: 'device',
    mount: true,
  })

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/live/buoy/stream`)

    source.addEventListener('snapshot', (event) => {
      const body = JSON.parse((event as MessageEvent).data) as Snapshot
      setMqtt(body.mqtt)
      setSamples(body.samples.slice(-MAX_POINTS))
      setLogs(body.logs ?? [])
      setStreamOk(true)
      setError(null)
    })

    source.addEventListener('sample', (event) => {
      const sample = JSON.parse((event as MessageEvent).data) as LiveSample
      setSamples((prev) => [...prev, sample].slice(-MAX_POINTS))
      setStreamOk(true)
    })

    source.addEventListener('log', (event) => {
      const line = JSON.parse((event as MessageEvent).data) as MqttLogLine
      setLogs((prev) => [...prev, line].slice(-500))
    })

    source.onerror = () => {
      setStreamOk(false)
      setError('Lost live stream — is the backend running on :3000?')
    }

    return () => source.close()
  }, [])

  const latest = samples.at(-1)

  const pose = useMemo(() => {
    const rt = runtime.current
    if (!latest) {
      return { frame: REST_POSE, stepUs: 0, jitterDeg: 0 }
    }

    const tSec = latest.timestamp / 1000
    const speed = Math.hypot(latest.gx, latest.gy, latest.gz) * (Math.PI / 180)
    const source = useKalman ? 'kalman' : 'device'
    if (rt.source !== source || rt.mount !== upsideDown) {
      rt.source = source
      rt.mount = upsideDown
      rt.armed = false
      rt.havePose = false
      rt.jitter = 0
      filter.current.primed = false
    }

    const imu = upsideDown ? flipImuSample(latest) : latest

    let roll: number
    let pitch: number
    let yaw: number
    let advanced = false

    if (useKalman) {
      if (!rt.armed || (rt.lastTs != null && latest.timestamp < rt.lastTs)) {
        rt.attitude = createKalmanAttitude()
        const started = performance.now()
        for (const sample of samples) {
          stepKalman(rt.attitude, upsideDown ? flipImuSample(sample) : sample)
        }
        rt.stepUs = samples.length
          ? ((performance.now() - started) * 1000) / samples.length
          : 0
        rt.lastTs = latest.timestamp
        rt.armed = true
        advanced = true
      } else if (rt.lastTs !== latest.timestamp) {
        const started = performance.now()
        stepKalman(rt.attitude, imu)
        rt.stepUs = (performance.now() - started) * 1000
        rt.lastTs = latest.timestamp
        advanced = true
      }
      roll = rt.attitude.roll.angle
      pitch = rt.attitude.pitch.angle
      yaw = rt.attitude.yaw
    } else {
      rt.armed = false
      advanced = rt.lastTs !== latest.timestamp
      rt.lastTs = latest.timestamp
      if (
        latest.roll !== undefined &&
        latest.pitch !== undefined &&
        latest.yaw !== undefined
      ) {
        roll = latest.roll
        pitch = latest.pitch
        yaw = latest.yaw
        if (upsideDown) {
          const mounted = flipChipAttitude(roll, pitch, yaw)
          roll = mounted.roll
          pitch = mounted.pitch
          yaw = mounted.yaw
        }
      } else {
        const tilt = accelToTilt(imu)
        const state = filter.current
        const dt = state.primed
          ? Math.min(0.25, Math.max(0.02, tSec - state.tSec || 0.1))
          : 0.1
        const toRad = Math.PI / 180
        const alpha = 0.96
        state.roll =
          alpha * (state.roll + imu.gx * toRad * dt) + (1 - alpha) * tilt.roll
        state.pitch =
          alpha * (state.pitch + imu.gy * toRad * dt) + (1 - alpha) * tilt.pitch
        state.yaw += imu.gz * toRad * dt
        state.tSec = tSec
        state.primed = true
        roll = state.roll
        pitch = state.pitch
        yaw = state.yaw
      }
    }

    if (advanced) {
      if (rt.havePose) {
        const step = angleDelta(roll, rt.prevRoll) + angleDelta(pitch, rt.prevPitch)
        rt.jitter = rt.jitter * 0.85 + step * 0.15
      }
      rt.prevRoll = roll
      rt.prevPitch = pitch
      rt.havePose = true
    }

    return {
      frame: {
        t: tSec,
        x: REST_POSE.x,
        y: REST_POSE.y,
        z: REST_POSE.z,
        roll,
        pitch,
        yaw,
        speed,
        height: REST_POSE.y,
        distance: 0,
      } satisfies TrajectoryFrame,
      stepUs: useKalman ? rt.stepUs : 0,
      jitterDeg: rt.jitter * RAD_TO_DEG,
    }
  }, [latest, samples, useKalman, upsideDown])

  return (
    <div className="simulation-page">
      <SimulationViewport frame={pose.frame} showMarker={false} />

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
          <p>
            {useKalman
              ? 'Board follows a browser Kalman filter on the raw IMU.'
              : 'Board follows device roll, pitch, and yaw.'}
          </p>
          {error ? <p>{error}</p> : null}
        </div>
        <button
          type="button"
          className={`simulation-page__back${useKalman ? ' is-active' : ''}`}
          aria-pressed={useKalman}
          onClick={() => setUseKalman((enabled) => !enabled)}
        >
          Kalman {useKalman ? 'on' : 'off'}
        </button>
        <button
          type="button"
          className={`simulation-page__back${upsideDown ? ' is-active' : ''}`}
          aria-pressed={upsideDown}
          onClick={() => setUpsideDown((enabled) => !enabled)}
        >
          IMU flip {upsideDown ? 'on' : 'off'}
        </button>
        <button
          type="button"
          className="simulation-page__back"
          aria-expanded={logOpen}
          onClick={() => setLogOpen(true)}
        >
          MQTT log
        </button>
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
        <div>
          <span>Attitude</span>
          <strong>
            {latest
              ? formatRpy(pose.frame.roll, pose.frame.pitch, pose.frame.yaw)
              : '—'}
          </strong>
        </div>
        <div>
          <span>Jitter</span>
          <strong>{latest ? `${pose.jitterDeg.toFixed(2)} °/sample` : '—'}</strong>
        </div>
        <div>
          <span>Filter</span>
          <strong>{useKalman ? `${pose.stepUs.toFixed(1)} µs` : 'off'}</strong>
        </div>
        <div>
          <span>GPS</span>
          <strong>
            {latest?.fix
              ? `${latest.lat?.toFixed(5)} ${latest.lon?.toFixed(5)} · ${latest.sat ?? 0} sat`
              : latest
                ? 'no fix'
                : '—'}
          </strong>
        </div>
      </aside>

      <LiveMiniMap samples={samples} />
      <MqttLogModal open={logOpen} lines={logs} onClose={() => setLogOpen(false)} />
    </div>
  )
}
