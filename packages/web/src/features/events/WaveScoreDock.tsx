import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HeatWave } from './api'
import { useScoreHeatWaveMutation } from './api'
import { average } from './heatUtils'

type Props = {
  waves: HeatWave[]
  judgeCount: number
  openWaveIds: string[]
  onDismiss: (waveId: string) => void
}

export function WaveScoreDock({
  waves,
  judgeCount,
  openWaveIds,
  onDismiss,
}: Props) {
  const queryClient = useQueryClient()
  const openWaves = useMemo(
    () =>
      openWaveIds
        .map((id) => waves.find((wave) => wave.id === id))
        .filter((wave): wave is HeatWave => Boolean(wave)),
    [openWaveIds, waves],
  )

  if (openWaves.length === 0) return null

  return (
    <div className="heat-score-dock" aria-live="polite">
      {openWaves.map((wave) => (
        <WaveScoreCard
          key={wave.id}
          wave={wave}
          judgeCount={judgeCount}
          onDismiss={() => onDismiss(wave.id)}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['Heat'] })
          }}
        />
      ))}
    </div>
  )
}

function WaveScoreCard({
  wave,
  judgeCount,
  onDismiss,
  onSaved,
}: {
  wave: HeatWave
  judgeCount: number
  onDismiss: () => void
  onSaved: () => void
}) {
  const score = useScoreHeatWaveMutation({
    onSuccess: () => onSaved(),
  })
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    scoresToDraft(wave),
  )
  const timers = useRef<Record<number, number>>({})

  useEffect(() => {
    setDrafts((current) => {
      let changed = false
      const next = { ...current }
      for (const row of wave.scores) {
        if (next[row.judgeIndex] == null || next[row.judgeIndex] === '') {
          next[row.judgeIndex] = formatScore(row.score)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [wave.scores])

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timers.current)) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  const filled = Object.entries(drafts)
    .filter(([, raw]) => raw.trim() !== '')
    .map(([index, value]) => ({ index: Number(index), value: Number(value) }))
    .filter((row) => Number.isFinite(row.value) && row.value >= 0)
  const liveAverage = average(filled.map((row) => row.value))

  const persist = (judgeIndex: number, raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') return
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value < 0 || value > 10) return
    const existing = wave.scores.find((row) => row.judgeIndex === judgeIndex)
    if (existing && existing.score === value) return
    score.mutate({ waveId: wave.id, judgeIndex, score: value })
  }

  const onDraftChange = (judgeIndex: number, raw: string) => {
    setDrafts((current) => ({ ...current, [judgeIndex]: raw }))
    window.clearTimeout(timers.current[judgeIndex])
    timers.current[judgeIndex] = window.setTimeout(() => {
      persist(judgeIndex, raw)
    }, 400)
  }

  return (
    <section className="heat-score-card">
      <header>
        <div>
          <strong>{wave.surfer.user.name}</strong>
          <span>
            Wave at {Math.floor(wave.elapsedSec / 60)}:
            {String(wave.elapsedSec % 60).padStart(2, '0')}
          </span>
        </div>
        <button type="button" className="heat-score-card__close" onClick={onDismiss}>
          ×
        </button>
      </header>
      <div className="heat-score-card__judges">
        {Array.from({ length: judgeCount }, (_, i) => i + 1).map((judgeIndex) => (
          <label key={judgeIndex}>
            <span>J{judgeIndex}</span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              inputMode="decimal"
              value={drafts[judgeIndex] ?? ''}
              onChange={(e) => onDraftChange(judgeIndex, e.target.value)}
              onBlur={(e) => persist(judgeIndex, e.target.value)}
            />
          </label>
        ))}
      </div>
      <footer>
        <span>
          Average{' '}
          <strong>
            {liveAverage != null ? liveAverage.toFixed(2) : '—'}
          </strong>
        </span>
        <span>
          {filled.length}/{judgeCount} judges
        </span>
        {score.isError ? (
          <span className="form-status form-status--error">
            {score.error.message}
          </span>
        ) : null}
      </footer>
    </section>
  )
}

function scoresToDraft(wave: HeatWave) {
  const drafts: Record<number, string> = {}
  for (const row of wave.scores) {
    drafts[row.judgeIndex] = formatScore(row.score)
  }
  return drafts
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
