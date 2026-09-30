import { useMemo } from 'react'
import { sampleTrajectory, generateMockTrajectory } from '../simulation/mockTrajectory'
import { SimulationViewport } from '../simulation/SimulationViewport'
import type { Session } from '../../types'
import { gpsAtCursor, sessionToTrajectory } from './sessionTrack'

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4] as const

type Props = {
  session: Session
  cursor: number
  playing: boolean
  speed: number
  onCursor: (index: number) => void
  onPlaying: (playing: boolean) => void
  onSpeed: (speed: number) => void
  onClose: () => void
}

export function SessionSimulation({
  session,
  cursor,
  playing,
  speed,
  onCursor,
  onPlaying,
  onSpeed,
  onClose,
}: Props) {
  const gpsRide = useMemo(() => sessionToTrajectory(session), [session])
  const demoRide = useMemo(() => generateMockTrajectory(18, 30), [])
  const ride = gpsRide ?? demoRide
  const usingGps = gpsRide != null
  const last = Math.max(0, session.samples.length - 1)
  const clamped = Math.min(Math.max(cursor, 0), last)

  const timeSec = useMemo(() => {
    if (session.samples.length === 0) return 0
    if (!usingGps) {
      return (clamped / Math.max(1, last)) * ride.durationSec
    }
    const t0 = session.samples[0].timestamp
    return (session.samples[clamped].timestamp - t0) / 1000
  }, [clamped, last, ride.durationSec, session.samples, usingGps])

  const frame = useMemo(
    () => sampleTrajectory(ride, timeSec),
    [ride, timeSec],
  )
  const progress = ride.durationSec > 0 ? timeSec / ride.durationSec : 0
  const position = gpsAtCursor(session.samples, clamped)

  return (
    <div className="simulation-page">
      <SimulationViewport frame={frame} ride={ride} progress={progress} />

      <header className="simulation-page__top">
        <button type="button" className="simulation-page__back" onClick={onClose}>
          ← Charts
        </button>
        <div>
          <h1>{session.id}</h1>
          <p>
            {usingGps
              ? 'Fullscreen trajectory from the session GPS track'
              : 'No GPS fixes — demo trajectory on the shared timeline'}
          </p>
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
        {position ? (
          <div>
            <span>GPS</span>
            <strong>
              {position.lat.toFixed(5)}, {position.lon.toFixed(5)}
            </strong>
          </div>
        ) : null}
      </aside>

      <footer className="simulation-page__timeline">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (clamped >= last) onCursor(0)
            onPlaying(!playing)
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onPlaying(false)
            onCursor(0)
          }}
        >
          Reset
        </button>
        <label className="simulation-page__scrub">
          <span>Timeline</span>
          <input
            type="range"
            min={0}
            max={last}
            value={clamped}
            onChange={(event) => {
              onPlaying(false)
              onCursor(Number(event.target.value))
            }}
          />
        </label>
        <label className="simulation-page__rate">
          <span>Rate</span>
          <select
            value={speed}
            onChange={(event) => onSpeed(Number(event.target.value))}
          >
            {REPLAY_SPEEDS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </label>
      </footer>
    </div>
  )
}
