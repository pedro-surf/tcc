import { ForecastFetchKind } from '@prisma/client'

const MIN_YEAR = 1980

export function utcMonthRange(year: number, month: number): {
  from: Date
  to: Date
} {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Month must be an integer from 1 to 12')
  }
  if (year < MIN_YEAR) {
    throw new Error(`Year must be ${MIN_YEAR} or later`)
  }

  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { from, to }
}

export function resolveMonthRange(year: number, month: number, now = new Date()): {
  year: number
  month: number
  from: Date
  to: Date
  kind: ForecastFetchKind
} {
  const { from, to } = utcMonthRange(year, month)
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1

  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    throw new Error('Cannot load forecast history for a future month')
  }

  const kind =
    year < currentYear || month < currentMonth
      ? ForecastFetchKind.HISTORY
      : ForecastFetchKind.FORECAST

  return { year, month, from, to, kind }
}

export function surfEnergyKj(swellM: number, periodSec: number | null): number | null {
  if (periodSec == null || !Number.isFinite(periodSec) || periodSec <= 0) return null
  if (!Number.isFinite(swellM) || swellM < 0) return null
  return Math.round(swellM * swellM * periodSec * 10) / 10
}
