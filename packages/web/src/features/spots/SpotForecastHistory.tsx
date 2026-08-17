import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ForecastTable from '../../ForecastTable'
import {
  previousUtcMonth,
  useEnsureSpotForecastMonthMutation,
  useSpotForecastCalendarQuery,
  useSpotForecastMonthQuery,
  type SpotForecastCalendarMonth,
  type SpotHistoryForecast,
} from './forecastHistory'

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SOURCE_LABEL: Record<string, string> = {
  COPERNICUS_MARINE: 'Copernicus Marine',
  WORLD_WEATHER_ONLINE: 'World Weather Online',
  OPEN_METEO_MARINE: 'Open-Meteo Marine',
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`
}

function toTableRows(forecasts: SpotHistoryForecast[]) {
  return forecasts.map((f) => ({
    ideal: f.ideal,
    score: f.score ?? undefined,
    userId: '',
    swell: f.swell,
    swellDir: f.swellDir,
    period: f.period ?? undefined,
    wind: f.wind,
    windDir: f.windDir,
    energy: f.energy ?? undefined,
    timestamp: new Date(f.timestamp ?? Date.now()),
  }))
}

type Props = {
  spotId: string
  isAuthenticated: boolean
}

export function SpotForecastHistory({ spotId, isAuthenticated }: Props) {
  const initial = previousUtcMonth()
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getUTCFullYear()
  const years = useMemo(() => {
    const list: number[] = []
    for (let value = currentYear; value >= 2010; value -= 1) list.push(value)
    return list
  }, [currentYear])

  const calendarQuery = useSpotForecastCalendarQuery(
    { spotId },
    { enabled: Boolean(spotId) },
  )
  const monthQuery = useSpotForecastMonthQuery(
    { spotId, year, month },
    { enabled: Boolean(spotId) },
  )
  const ensureMonth = useEnsureSpotForecastMonthMutation({
    onSuccess: async () => {
      setError(null)
      await Promise.all([calendarQuery.refetch(), monthQuery.refetch()])
    },
    onError: (err) => {
      setError(err.message || 'Failed to load this month')
    },
  })

  const filled = useMemo(() => {
    const map = new Map<string, SpotForecastCalendarMonth>()
    for (const item of calendarQuery.data?.spotForecastCalendar ?? []) {
      map.set(monthKey(item.year, item.month), item)
    }
    return map
  }, [calendarQuery.data?.spotForecastCalendar])

  const selectedFill = filled.get(monthKey(year, month))
  const monthData = monthQuery.data?.spotForecastMonth
  const rows = toTableRows(monthData?.forecasts ?? [])
  const yearMonths = MONTH_LABELS.map((label, index) => {
    const value = index + 1
    const now = new Date()
    const isFuture =
      year > now.getUTCFullYear() ||
      (year === now.getUTCFullYear() && value > now.getUTCMonth() + 1)
    return {
      label,
      value,
      isFuture,
      filled: filled.get(monthKey(year, value)),
    }
  })

  return (
    <section className="spot-details__section">
      <div className="spot-details__weekly-head">
        <div>
          <h2>Past conditions</h2>
          <p className="spot-details__hint">
            Pick a month in the past. The first lookup calls the marine HTTP API
            (same style as the weekly AI request) and stores the JSON on this
            spot; later visits reuse the calendar.
          </p>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={ensureMonth.isPending}
            onClick={() => {
              setError(null)
              ensureMonth.mutate({ spotId, year, month })
            }}
          >
            {ensureMonth.isPending
              ? 'Loading…'
              : selectedFill
                ? 'Load stored month'
                : 'Load month'}
          </button>
        ) : (
          <Link to="/" className="btn btn-secondary">
            Sign in to load history
          </Link>
        )}
      </div>

      <div className="spot-history__controls">
        <label>
          Year
          <select
            value={year}
            onChange={(event) => {
              const nextYear = Number(event.target.value)
              setYear(nextYear)
              const now = new Date()
              const maxMonth =
                nextYear === now.getUTCFullYear() ? now.getUTCMonth() + 1 : 12
              if (month > maxMonth) setMonth(maxMonth)
            }}
          >
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Month
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {MONTH_LABELS.map((label, index) => {
              const value = index + 1
              const now = new Date()
              const isFuture =
                year > now.getUTCFullYear() ||
                (year === now.getUTCFullYear() && value > now.getUTCMonth() + 1)
              return (
                <option key={label} value={value} disabled={isFuture}>
                  {label}
                </option>
              )
            })}
          </select>
        </label>
      </div>

      <div className="spot-history__calendar" aria-label={`Stored months in ${year}`}>
        {yearMonths.map((item) => (
          <button
            key={item.value}
            type="button"
            className={[
              'spot-history__chip',
              item.filled ? 'is-filled' : '',
              item.value === month ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={item.isFuture}
            onClick={() => setMonth(item.value)}
          >
            {item.label.slice(0, 3)}
            {item.filled ? ` · ${item.filled.rowCount}` : ''}
          </button>
        ))}
      </div>

      {monthData ? (
        <p className="spot-details__media-caption">
          {MONTH_LABELS[month - 1]} {year}
          {' · '}
          {SOURCE_LABEL[monthData.source] ?? monthData.source}
          {' · '}
          {monthData.kind === 'HISTORY' ? 'history' : 'forecast'}
          {' · '}
          {monthData.fromCache ? 'from stored calendar' : 'just fetched and stored'}
          {' · '}
          {monthData.forecasts.length} rows
        </p>
      ) : selectedFill ? (
        <p className="spot-details__media-caption">
          Stored {MONTH_LABELS[month - 1]} {year} from{' '}
          {SOURCE_LABEL[selectedFill.source] ?? selectedFill.source} (
          {selectedFill.rowCount} rows)
        </p>
      ) : (
        <p className="spot-details__media-caption">
          This month is not in the calendar yet.
        </p>
      )}

      {error ? <p className="form-status form-status--error">{error}</p> : null}

      {monthQuery.isLoading ? (
        <p>Loading stored month…</p>
      ) : rows.length === 0 ? (
        <p>No rows for this month yet. Load it to fill the calendar.</p>
      ) : (
        <ForecastTable data={rows} />
      )}
    </section>
  )
}

export default SpotForecastHistory
