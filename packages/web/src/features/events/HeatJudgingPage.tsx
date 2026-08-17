import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import {
  HeatStatusEnum,
  type HeatWave,
  useEndHeatMutation,
  useHeatQuery,
  useMarkHeatWaveMutation,
  useStartHeatMutation,
} from './api'
import { HeatTimeline } from './HeatTimeline'
import { WaveScoreDock } from './WaveScoreDock'
import { formatClock, surferColor } from './heatUtils'
import './events.css'

export function HeatJudgingPage() {
  const { eventId = '', heatId = '' } = useParams()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [openWaveIds, setOpenWaveIds] = useState<string[]>([])
  const [pendingWaves, setPendingWaves] = useState<HeatWave[]>([])
  const endingRef = useRef(false)

  const heatQuery = useHeatQuery(
    { id: heatId },
    {
      enabled: Boolean(heatId),
      staleTime: 0,
      refetchInterval: 2000,
    },
  )
  const heat = heatQuery.data?.heat

  const clock = useHeatClock(
    heat?.startedAt,
    heat?.durationMin ?? 0,
    heat?.status,
  )

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['Heat'] })
    await queryClient.invalidateQueries({ queryKey: ['SpotCompetition'] })
  }

  const start = useStartHeatMutation({ onSuccess: invalidate })
  const end = useEndHeatMutation({ onSuccess: invalidate })
  const markWave = useMarkHeatWaveMutation({
    onSuccess: async (result) => {
      const wave = result.markHeatWave
      setPendingWaves((current) =>
        current.some((item) => item.id === wave.id)
          ? current
          : [wave, ...current],
      )
      setOpenWaveIds((current) =>
        current.includes(wave.id) ? current : [wave.id, ...current],
      )
      await invalidate()
    },
  })

  const displayHeat = useMemo(() => {
    if (!heat) return heat
    const known = new Set(heat.waves.map((wave) => wave.id))
    const extra = pendingWaves.filter((wave) => !known.has(wave.id))
    if (extra.length === 0) return heat
    return {
      ...heat,
      waves: [...heat.waves, ...extra].sort(
        (a, b) => a.elapsedSec - b.elapsedSec,
      ),
    }
  }, [heat, pendingWaves])

  useEffect(() => {
    if (
      heat?.status === HeatStatusEnum.Running &&
      clock.remainingSec <= 0 &&
      isAuthenticated &&
      !endingRef.current &&
      !end.isPending
    ) {
      endingRef.current = true
      end.mutate({ heatId })
    }
    if (heat?.status === HeatStatusEnum.Finished) {
      endingRef.current = false
    }
  }, [
    clock.remainingSec,
    end,
    heat?.status,
    heatId,
    isAuthenticated,
  ])

  const ranked = useMemo(() => {
    if (!heat) return []
    return [...heat.surfers].sort((a, b) => b.heatTotal - a.heatTotal)
  }, [heat])

  if (heatQuery.isLoading) {
    return <div className="events-page">Loading heat…</div>
  }

  if (!displayHeat) {
    return (
      <div className="events-page">
        <p>Heat not found.</p>
        <Link to={eventId ? `/events/${eventId}` : '/events'}>Back to event</Link>
      </div>
    )
  }

  const running = displayHeat.status === HeatStatusEnum.Running
  const finished = displayHeat.status === HeatStatusEnum.Finished
  const canMark = running && isAuthenticated

  return (
    <div className="events-page heat-page">
      <header className="events-page__header">
        <div>
          <Link to={`/events/${displayHeat.competition.id}`} className="spot-details__back">
            ← {displayHeat.competition.name}
          </Link>
          <h1>{displayHeat.name}</h1>
          <p>
            {displayHeat.competition.spot.name} · {displayHeat.surfers.length} surfers ·{' '}
            {displayHeat.judgeCount} judge{displayHeat.judgeCount === 1 ? '' : 's'} ·{' '}
            {displayHeat.durationMin} min
          </p>
        </div>
        <div className="heat-page__actions">
          {!isAuthenticated ? (
            <Link to="/" className="btn btn-secondary">
              Sign in to judge
            </Link>
          ) : running ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={end.isPending}
              onClick={() => end.mutate({ heatId: displayHeat.id })}
            >
              {end.isPending ? 'Ending…' : 'End heat'}
            </button>
          ) : finished ? (
            <span className="heat-status heat-status--done">Finished</span>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={start.isPending}
              onClick={() => start.mutate({ heatId: displayHeat.id })}
            >
              {start.isPending ? 'Starting…' : 'Start heat'}
            </button>
          )}
        </div>
      </header>

      {(start.isError || end.isError || markWave.isError) && (
        <p className="form-status form-status--error">
          {(start.error ?? end.error ?? markWave.error)?.message}
        </p>
      )}

      <section className={`heat-timer${running ? ' is-live' : ''}${finished ? ' is-done' : ''}`}>
        <span className="heat-timer__label">
          {finished ? 'Heat over' : running ? 'Time remaining' : 'Ready'}
        </span>
        <strong>{formatClock(clock.remainingSec)}</strong>
        <span className="heat-timer__meta">
          Elapsed {formatClock(clock.elapsedSec)} / {formatClock(clock.totalSec)}
        </span>
      </section>

      <div className="heat-page__grid">
        <section className="events-page__section">
          <h2>Surfers</h2>
          <ul className="heat-surfers">
            {ranked.map((surfer, index) => (
              <li key={surfer.id}>
                <span
                  className="heat-surfers__color"
                  style={{ background: surferColor(displayHeat.surfers.indexOf(surfer)) }}
                />
                <div className="heat-surfers__info">
                  <strong>
                    {index + 1}. {surfer.user.name}
                  </strong>
                  <span>
                    {surfer.waves.length} wave
                    {surfer.waves.length === 1 ? '' : 's'} · best 2 avg{' '}
                    {surfer.heatTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canMark || markWave.isPending}
                  onClick={() =>
                    markWave.mutate({
                      heatId: displayHeat.id,
                      surferId: surfer.id,
                    })
                  }
                >
                  Wave surfed
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="events-page__section">
          <h2>Heat timeline</h2>
          <HeatTimeline
            heat={displayHeat}
            onSelectWave={(waveId) =>
              setOpenWaveIds((current) =>
                current.includes(waveId) ? current : [waveId, ...current],
              )
            }
          />
        </section>
      </div>

      <WaveScoreDock
        waves={displayHeat.waves}
        judgeCount={displayHeat.judgeCount}
        openWaveIds={openWaveIds}
        onDismiss={(waveId) =>
          setOpenWaveIds((current) => current.filter((id) => id !== waveId))
        }
      />
    </div>
  )
}

function useHeatClock(
  startedAt?: string | null,
  durationMin = 0,
  status?: string,
) {
  const [now, setNow] = useState(() => Date.now())
  const totalSec = durationMin * 60

  useEffect(() => {
    if (status !== HeatStatusEnum.Running || !startedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt, status])

  if (!startedAt || status === HeatStatusEnum.Pending) {
    return { elapsedSec: 0, remainingSec: totalSec, totalSec }
  }

  const elapsedSec = Math.min(
    totalSec,
    Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)),
  )
  return {
    elapsedSec,
    remainingSec: Math.max(0, totalSec - elapsedSec),
    totalSec,
  }
}

export default HeatJudgingPage
