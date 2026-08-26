import {
  DIRECTION_MATCH_LEGEND,
  getDirectionMatch,
  normalizeAngle,
} from './utils/windDirectionMatch'
import './WindRoseOverlap.css'

type Props = {
  idealAngle: number
  actualAngle: number
  size?: number
  label?: string
  idealLabel?: string
  actualLabel?: string
  showLegend?: boolean
}

export default function WindRoseOverlap({
  idealAngle,
  actualAngle,
  size = 160,
  label = 'Direction match',
  idealLabel = 'Ideal',
  actualLabel = 'Forecast',
  showLegend = false,
}: Props) {
  const ideal = normalizeAngle(idealAngle)
  const actual = normalizeAngle(actualAngle)
  const match = getDirectionMatch(ideal, actual)

  return (
    <div className="wind-rose-overlap">
      <div className="wind-rose-overlap__head">
        <span className="wind-rose-overlap__title">{label}</span>
        <span
          className="wind-rose-overlap__badge"
          style={{ backgroundColor: match.color }}
        >
          {match.label} · {match.delta.toFixed(0)}° off
        </span>
      </div>

      <div
        className="wind-rose-overlap__dial"
        style={{
          width: size,
          height: size,
          ['--match-color' as string]: match.color,
        }}
      >
        <span className="wind-rose-overlap__n">N</span>
        <span className="wind-rose-overlap__e">E</span>
        <span className="wind-rose-overlap__s">S</span>
        <span className="wind-rose-overlap__w">W</span>

        <div
          className="wind-rose-overlap__sector"
          style={{ transform: `rotate(${ideal}deg)` }}
        />

        <div
          className="wind-rose-overlap__needle wind-rose-overlap__needle--ideal"
          style={{
            height: size * 0.42,
            transform: `translate(-50%, -100%) rotate(${ideal}deg)`,
          }}
        />
        <div
          className="wind-rose-overlap__needle wind-rose-overlap__needle--actual"
          style={{
            height: size * 0.46,
            transform: `translate(-50%, -100%) rotate(${actual}deg)`,
            backgroundColor: match.color,
            boxShadow: `0 0 0 1px ${match.color}55`,
          }}
        />

        <div className="wind-rose-overlap__hub">
          <span>{match.score}</span>
        </div>
      </div>

      <div className="wind-rose-overlap__meta">
        <span>
          <i className="wind-rose-overlap__dot wind-rose-overlap__dot--ideal" />
          {idealLabel}: {ideal.toFixed(0)}°
        </span>
        <span>
          <i
            className="wind-rose-overlap__dot wind-rose-overlap__dot--actual"
            style={{ backgroundColor: match.color }}
          />
          {actualLabel}: {actual.toFixed(0)}°
        </span>
      </div>

      {showLegend ? (
        <div className="wind-rose-overlap__legend">
          <p className="wind-rose-overlap__legend-title">Color key</p>
          <ul>
            {DIRECTION_MATCH_LEGEND.map((item) => (
              <li key={item.quality}>
                <span
                  className="wind-rose-overlap__legend-swatch"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <strong>{item.range}</strong>
                  <span>{item.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
