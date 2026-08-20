import { Link } from 'react-router-dom'
import {
  IdealOriginEnum,
  degreesToCompass,
  useSpotWeekRankingQuery,
} from './api'
import './SpotRankingPage.css'

export function SpotRankingPage() {
  const query = useSpotWeekRankingQuery({ take: 20 })
  const ranks = query.data?.spotWeekRanking ?? []
  const from = new Date()
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className="spot-ranking">
      <header className="spot-ranking__header">
        <div>
          <h1>Best spots this week</h1>
          <p>
            Next 7 days ({from.toLocaleDateString()} – {to.toLocaleDateString()}
            ). Ranked in the database by circular wind/swell angle proximity
            (350° is close to 10°) against each spot’s ideal directions and any
            extra <strong>ideal</strong> forecast windows.
          </p>
        </div>
      </header>

      {query.isLoading ? (
        <p>Scoring spots…</p>
      ) : query.isError ? (
        <p className="form-status form-status--error">
          {query.error.message || 'Failed to load ranking'}
        </p>
      ) : ranks.length === 0 ? (
        <p>
          No ranked spots yet. Load the current month on a spot so next-week
          forecast rows exist, and set ideal directions (or ideal forecast
          rows).
        </p>
      ) : (
        <ol className="spot-ranking__list">
          {ranks.map((row, index) => (
            <li key={row.spotId} className="spot-ranking__card">
              <span className="spot-ranking__rank">#{index + 1}</span>
              <div className="spot-ranking__body">
                <h2>
                  <Link to={`/spots/${row.spot.id}`}>{row.spot.name}</Link>
                </h2>
                <p className="spot-ranking__meta">
                  {row.spot.country.replaceAll('_', ' ')} ·{' '}
                  {row.spot.waveType.replaceAll('_', ' ')} · {row.idealCount}{' '}
                  ideal vector{row.idealCount === 1 ? '' : 's'} ·{' '}
                  {row.forecastCount} forecast hours
                </p>
                <p className="spot-ranking__match">
                  Best window {new Date(row.bestAt).toLocaleString()} · swell{' '}
                  {row.bestSwell.toFixed(1)}m {degreesToCompass(row.bestSwellDir)}{' '}
                  · wind {row.bestWind.toFixed(0)} {degreesToCompass(row.bestWindDir)}
                  {' · '}
                  {row.matchedOrigin === IdealOriginEnum.Forecast
                    ? 'matched an ideal forecast window'
                    : `matched spot ideal (${degreesToCompass(row.spot.idealSwellDir)} swell / ${degreesToCompass(row.spot.idealWindDir)} wind)`}
                </p>
                <div
                  className="spot-ranking__bar"
                  aria-label={`Week score ${row.weekScore.toFixed(0)}`}
                >
                  <span style={{ width: `${Math.min(100, row.weekScore)}%` }} />
                </div>
              </div>
              <div className="spot-ranking__scores">
                <strong>{row.weekScore.toFixed(0)}</strong>
                <span>week</span>
                <em>{row.bestScore.toFixed(0)} peak</em>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default SpotRankingPage
