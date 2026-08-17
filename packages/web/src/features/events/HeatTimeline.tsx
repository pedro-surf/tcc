import type { CompetitionHeat } from './api'
import { formatClock, surferColor } from './heatUtils'

type Props = {
  heat: CompetitionHeat
  onSelectWave?: (waveId: string) => void
}

export function HeatTimeline({ heat, onSelectWave }: Props) {
  const totalSec = heat.durationMin * 60
  const surferIndex = new Map(
    heat.surfers.map((surfer, index) => [surfer.id, index]),
  )

  return (
    <div className="heat-timeline">
      <div className="heat-timeline__bar">
        <span className="heat-timeline__label">0:00</span>
        <div className="heat-timeline__track">
          {heat.waves.map((wave) => {
            const left = Math.min(100, (wave.elapsedSec / totalSec) * 100)
            const color = surferColor(surferIndex.get(wave.surferId) ?? 0)
            return (
              <button
                key={wave.id}
                type="button"
                className="heat-timeline__mark"
                style={{ left: `${left}%`, background: color }}
                title={`${wave.surfer.user.name} · ${formatClock(wave.elapsedSec)}${
                  wave.averageScore != null
                    ? ` · ${wave.averageScore.toFixed(2)}`
                    : ''
                }`}
                onClick={() => onSelectWave?.(wave.id)}
              />
            )
          })}
        </div>
        <span className="heat-timeline__label">
          {formatClock(totalSec)}
        </span>
      </div>
      {heat.waves.length === 0 ? (
        <p className="heat-timeline__empty">
          No waves yet. Mark “wave surfed” during the heat.
        </p>
      ) : (
        <ol className="heat-timeline__list">
          {heat.waves.map((wave) => (
            <li key={wave.id}>
              <button
                type="button"
                className="heat-timeline__row"
                onClick={() => onSelectWave?.(wave.id)}
              >
                <span
                  className="heat-timeline__dot"
                  style={{
                    background: surferColor(
                      surferIndex.get(wave.surferId) ?? 0,
                    ),
                  }}
                />
                <strong>{formatClock(wave.elapsedSec)}</strong>
                <span>{wave.surfer.user.name}</span>
                <span className="heat-timeline__score">
                  {wave.averageScore != null
                    ? wave.averageScore.toFixed(2)
                    : `${wave.scoredCount}/${heat.judgeCount} judges`}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
