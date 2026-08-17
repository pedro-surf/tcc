import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { fetcher } from '../../graphql/fetcher'

export const ForecastSourceEnum = {
  CopernicusMarine: 'COPERNICUS_MARINE',
  WorldWeatherOnline: 'WORLD_WEATHER_ONLINE',
  OpenMeteoMarine: 'OPEN_METEO_MARINE',
} as const

export type ForecastSourceEnum =
  (typeof ForecastSourceEnum)[keyof typeof ForecastSourceEnum]

export const ForecastFetchKindEnum = {
  Forecast: 'FORECAST',
  History: 'HISTORY',
} as const

export type ForecastFetchKindEnum =
  (typeof ForecastFetchKindEnum)[keyof typeof ForecastFetchKindEnum]

export type SpotHistoryForecast = {
  id: string
  ideal: boolean
  score?: number | null
  swell: number
  swellDir: number
  wind: number
  windDir: number
  period?: number | null
  energy?: number | null
  temp?: number | null
  timestamp?: string | null
  source?: ForecastSourceEnum | null
}

export type SpotForecastMonth = {
  fetchId: string
  year: number
  month: number
  kind: ForecastFetchKindEnum
  source: ForecastSourceEnum
  fromCache: boolean
  from: string
  to: string
  forecasts: SpotHistoryForecast[]
}

export type SpotForecastCalendarMonth = {
  year: number
  month: number
  source: ForecastSourceEnum
  kind: ForecastFetchKindEnum
  fetchedAt: string
  rowCount: number
}

const SpotForecastCalendarDocument = `
  query SpotForecastCalendar($spotId: String!) {
    spotForecastCalendar(spotId: $spotId) {
      year
      month
      source
      kind
      fetchedAt
      rowCount
    }
  }
`

const SpotForecastMonthDocument = `
  query SpotForecastMonth($spotId: String!, $year: Int!, $month: Int!) {
    spotForecastMonth(spotId: $spotId, year: $year, month: $month) {
      fetchId
      year
      month
      kind
      source
      fromCache
      from
      to
      forecasts {
        id
        ideal
        score
        swell
        swellDir
        wind
        windDir
        period
        energy
        temp
        timestamp
        source
      }
    }
  }
`

const EnsureSpotForecastMonthDocument = `
  mutation EnsureSpotForecastMonth($spotId: ID!, $year: Int!, $month: Int!) {
    ensureSpotForecastMonth(spotId: $spotId, year: $year, month: $month) {
      fetchId
      year
      month
      kind
      source
      fromCache
      from
      to
      forecasts {
        id
        ideal
        score
        swell
        swellDir
        wind
        windDir
        period
        energy
        temp
        timestamp
        source
      }
    }
  }
`

type CalendarQuery = {
  spotForecastCalendar: SpotForecastCalendarMonth[]
}

type MonthQuery = {
  spotForecastMonth: SpotForecastMonth | null
}

type EnsureMutation = {
  ensureSpotForecastMonth: SpotForecastMonth
}

type MonthVars = {
  spotId: string
  year: number
  month: number
}

export function useSpotForecastCalendarQuery(
  variables: { spotId: string },
  options?: Omit<
    UseQueryOptions<CalendarQuery, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: ['SpotForecastCalendar', variables],
    queryFn: fetcher<CalendarQuery, { spotId: string }>(
      SpotForecastCalendarDocument,
      variables,
    ),
    ...options,
  })
}

export function useSpotForecastMonthQuery(
  variables: MonthVars,
  options?: Omit<UseQueryOptions<MonthQuery, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ['SpotForecastMonth', variables],
    queryFn: fetcher<MonthQuery, MonthVars>(
      SpotForecastMonthDocument,
      variables,
    ),
    ...options,
  })
}

export function useEnsureSpotForecastMonthMutation(
  options?: UseMutationOptions<EnsureMutation, Error, MonthVars>,
) {
  return useMutation({
    mutationKey: ['EnsureSpotForecastMonth'],
    mutationFn: (variables: MonthVars) =>
      fetcher<EnsureMutation, MonthVars>(
        EnsureSpotForecastMonthDocument,
        variables,
      )(),
    ...options,
  })
}

export function previousUtcMonth(now = new Date()): { year: number; month: number } {
  const year = now.getUTCFullYear()
  const monthIndex = now.getUTCMonth()
  if (monthIndex === 0) return { year: year - 1, month: 12 }
  return { year, month: monthIndex }
}
