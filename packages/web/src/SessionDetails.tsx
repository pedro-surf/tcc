import { useEffect, useRef, useState } from 'react'
import type { Session } from './types'
import SensorCharts from './SensorCharts'
import { Board3D } from './Board'
import { SessionTrackMap } from './components/map/SessionTrackMap'
import {
  REPLAY_SPEEDS,
  SessionSimulation,
} from './features/sessions/SessionSimulation'
import './features/sessions/SessionReplay.css'

type ReplayView = 'analysis' | 'simulation'

type Props = {
  session: Session
  hideTimeline?: boolean
  hideReplay?: boolean
  hideManuevers?: boolean
}

export default function SessionDetail({
  session,
  hideReplay,
  hideTimeline,
  hideManuevers,
}: Props) {
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [view, setView] = useState<ReplayView>('analysis')

  const playerRef = useRef(0)
  useEffect(() => {
    if (!playing) return

    const last = session.samples.length - 1
    const player = setInterval(() => {
      setCursor((current) => {
        playerRef.current += speed
        const step = Math.floor(playerRef.current)
        playerRef.current -= step
        const next = Math.min(current + step, last)
        if (next >= last) queueMicrotask(() => setPlaying(false))
        return next
      })
    }, 16)

    return () => clearInterval(player)
  }, [playing, speed, session.samples.length])

  const currentSample = session.samples[cursor]
  if (!currentSample) return null

  const magnitudeAcc = Math.sqrt(
    currentSample.ax ** 2 + currentSample.ay ** 2 + currentSample.az ** 2,
  )
  const magnitudeGyro = Math.sqrt(
    currentSample.gx ** 2 + currentSample.gy ** 2 + currentSample.gz ** 2,
  )

  if (!hideReplay && view === 'simulation') {
    return (
      <SessionSimulation
        session={session}
        cursor={cursor}
        playing={playing}
        speed={speed}
        onCursor={setCursor}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
        onClose={() => setView('analysis')}
      />
    )
  }

  return (
    <div className="session-replay">
      {!hideReplay && (
        <div className="session-replay__switch" role="tablist" aria-label="Replay view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'analysis'}
            className={view === 'analysis' ? 'is-active' : ''}
            onClick={() => setView('analysis')}
          >
            Charts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => setView('simulation')}
          >
            Simulation
          </button>
        </div>
      )}

      {!hideTimeline && (
        <div className="session-replay__transport">
          <button
            type="button"
            onClick={() => {
              if (!playing && cursor >= session.samples.length - 1) setCursor(0)
              setPlaying((value) => !value)
            }}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <select
            value={speed}
            aria-label="Playback rate"
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            {REPLAY_SPEEDS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
          <input
            type="range"
            min={0}
            max={session.samples.length - 1}
            value={cursor}
            aria-label="Timeline"
            onChange={(event) => setCursor(Number(event.target.value))}
          />
        </div>
      )}

      <Results predictions={session.predictions} />

      <div className="session-replay__grid">
        <div className="session-replay__charts">
          <SensorCharts session={session} setCursor={setCursor} />
        </div>

        {!hideReplay && (
          <div className="session-replay__board">
            <h3>Replay</h3>
            <div className="session-replay__board-canvas">
              <Board3D sample={currentSample} />
            </div>
            <div className="session-replay__readout">
              <span>acc {magnitudeAcc.toFixed(2)}</span>
              <span>gyr {magnitudeGyro.toFixed(2)}</span>
              {currentSample.lat != null && currentSample.lon != null ? (
                <span>
                  {currentSample.lat.toFixed(5)}, {currentSample.lon.toFixed(5)}
                </span>
              ) : null}
            </div>
          </div>
        )}

        {!hideReplay && (
          <div className="session-replay__map">
            <h3>GPS</h3>
            <SessionTrackMap samples={session.samples} cursor={cursor} />
          </div>
        )}

        {!hideManuevers && (
          <div className="session-replay__maneuvers">
            <h3>Manuevers</h3>
            {session.manuevers.length > 0 ? (
              <ul>
                {session.manuevers.map((event, index) => (
                  <li key={`${event.timestamp}-${index}`}>
                    {event.timestamp}ms → {event.type} (Score: {event.score.toFixed(1)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="app-meta">No maneuvers in this session.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const Results = ({
  predictions = [],
}: {
  predictions: Session['predictions']
}) => {
  return predictions.map((prediction) => (
    <h3 key={`${prediction.label}-${prediction.value}`}>
      {prediction.label}: {(100 * prediction.value).toFixed(2)}%
    </h3>
  ))
}
