import { useEffect, useMemo, useState } from 'react'
import { Board3D } from '../../Board'
import SensorCharts from '../../SensorCharts'
import { API_BASE_URL } from '../../graphql/client'
import type { Sample, Session } from '../../types'
import './LiveBuoyPage.css'

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

export function LiveBuoyPage() {
  const [samples, setSamples] = useState<LiveSample[]>([])
  const [mqtt, setMqtt] = useState(false)
  const [streamOk, setStreamOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const session: Session = useMemo(
    () => ({
      id: latest?.device ?? 'buoy-live',
      samples,
      results: [],
      intervalMs: 1000,
      manuevers: [],
      predictions: [],
    }),
    [latest?.device, samples],
  )

  return (
    <div className="live-buoy">
      <div className="live-buoy__status">
        <span className={streamOk ? 'is-on' : 'is-off'}>
          app {streamOk ? 'live' : 'offline'}
        </span>
        <span className={mqtt ? 'is-on' : 'is-off'}>
          mqtt {mqtt ? 'up' : 'down'}
        </span>
        {latest ? (
          <span>
            {latest.device} · P {latest.pressure.toFixed(0)} Pa · T{' '}
            {latest.temperature.toFixed(1)} °C · {samples.length} pts
          </span>
        ) : (
          <span>waiting for buoy-sensor-v1…</span>
        )}
      </div>
      {error ? <p className="live-buoy__error">{error}</p> : null}

      <div className="live-buoy__grid">
        <div className="live-buoy__chart">
          <SensorCharts
            session={session}
            setCursor={() => undefined}
            title="Live IMU"
          />
        </div>
        <div className="live-buoy__board">
          <h3>Live orientation</h3>
          <div className="live-buoy__canvas">
            <Board3D sample={latest} />
          </div>
          {latest ? (
            <p>
              acc {latest.ax.toFixed(2)} {latest.ay.toFixed(2)}{' '}
              {latest.az.toFixed(2)} g · gyro {latest.gx.toFixed(1)}{' '}
              {latest.gy.toFixed(1)} {latest.gz.toFixed(1)} dps · mag{' '}
              {latest.mx.toFixed(1)} {latest.my.toFixed(1)} {latest.mz.toFixed(1)}{' '}
              µT
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
