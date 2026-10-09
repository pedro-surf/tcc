import { useEffect, useState } from 'react'
import SensorCharts, { type ChartCut } from '../../SensorCharts'
import type { Sample, Session } from '../../types'
import './ImportCutModal.css'

type Props = {
  label: string
  samples: Sample[]
  onCancel: () => void
  onConfirm: (session: Session, startedAtMs: number) => void | Promise<void>
  buildSession: (samples: Sample[]) => Session
}

function formatRealTime(timestamp: number) {
  if (timestamp > 1_000_000_000_000) {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return `${(timestamp / 1000).toFixed(1)} s`
}

export function ImportCutModal({
  label,
  samples,
  onCancel,
  onConfirm,
  buildSession,
}: Props) {
  const last = Math.max(0, samples.length - 1)
  const [cut, setCut] = useState<ChartCut>({ start: 0, end: last })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const preview: Session = {
    id: label,
    samples,
    intervalMs: 0,
    results: [],
    predictions: [],
    manuevers: [],
    activities: [],
    classifierSlot: 'heuristic',
  }
  const startAt = samples[cut.start]?.timestamp
  const endAt = samples[cut.end]?.timestamp

  return (
    <div className="import-cut" role="presentation" onClick={onCancel}>
      <section
        className="import-cut__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Trim imported session"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="import-cut__bar">
          <div>
            <p className="app-meta">Import</p>
            <h2>{label}</h2>
          </div>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </header>

        <SensorCharts
          session={preview}
          setCursor={() => {}}
          title=""
          clock="absolute"
          cut={cut}
          onCutChange={setCut}
        />

        <div className="import-cut__range">
          <label>
            Start
            <strong>{startAt == null ? '—' : formatRealTime(startAt)}</strong>
            <input
              type="range"
              min={0}
              max={last}
              value={cut.start}
              onChange={(event) => {
                const start = Number(event.target.value)
                setCut((current) =>
                  start <= current.end
                    ? { start, end: current.end }
                    : { start: current.end, end: start },
                )
              }}
            />
          </label>
          <label>
            End
            <strong>{endAt == null ? '—' : formatRealTime(endAt)}</strong>
            <input
              type="range"
              min={0}
              max={last}
              value={cut.end}
              onChange={(event) => {
                const end = Number(event.target.value)
                setCut((current) =>
                  end >= current.start
                    ? { start: current.start, end }
                    : { start: end, end: current.start },
                )
              }}
            />
          </label>
        </div>

        {saveError ? <p className="app-meta">{saveError}</p> : null}
        <footer className="import-cut__actions">
          <p className="app-meta">
            {cut.end - cut.start + 1} samples kept
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const slice = samples.slice(cut.start, cut.end + 1)
              const startedAt = slice[0]?.timestamp ?? Date.now()
              setSaving(true)
              setSaveError(null)
              try {
                await onConfirm(buildSession(slice), startedAt)
              } catch (err) {
                setSaveError(err instanceof Error ? err.message : 'Could not save session')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving…' : 'Analyse this range'}
          </button>
        </footer>
      </section>
    </div>
  )
}
