import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { fetcher } from '../../graphql/fetcher'

export const IdealOriginEnum = {
  Spot: 'SPOT',
  Forecast: 'FORECAST',
} as const

export type IdealOriginEnum =
  (typeof IdealOriginEnum)[keyof typeof IdealOriginEnum]

export type SpotWeekRank = {
  spotId: string
  weekScore: number
  bestScore: number
  bestAt: string
  matchedOrigin: IdealOriginEnum
  idealCount: number
  forecastCount: number
  bestSwell: number
  bestSwellDir: number
  bestWind: number
  bestWindDir: number
  spot: {
    id: string
    name: string
    country: string
    waveType: string
    mapsUrl?: string | null
    idealWindDir?: number | null
    idealSwellDir?: number | null
  }
  bestForecast?: {
    id: string
    timestamp?: string | null
    swell: number
    swellDir: number
    wind: number
    windDir: number
    period?: number | null
    ideal: boolean
  } | null
  matchedIdealForecast?: {
    id: string
    swell: number
    swellDir: number
    wind: number
    windDir: number
    period?: number | null
    ideal: boolean
  } | null
}

const SpotWeekRankingDocument = `
  query SpotWeekRanking($take: Int) {
    spotWeekRanking(take: $take) {
      spotId
      weekScore
      bestScore
      bestAt
      matchedOrigin
      idealCount
      forecastCount
      bestSwell
      bestSwellDir
      bestWind
      bestWindDir
      spot {
        id
        name
        country
        waveType
        mapsUrl
        idealWindDir
        idealSwellDir
      }
      bestForecast {
        id
        timestamp
        swell
        swellDir
        wind
        windDir
        period
        ideal
      }
      matchedIdealForecast {
        id
        swell
        swellDir
        wind
        windDir
        period
        ideal
      }
    }
  }
`

type RankingQuery = {
  spotWeekRanking: SpotWeekRank[]
}

export function useSpotWeekRankingQuery(
  variables?: { take?: number },
  options?: Omit<UseQueryOptions<RankingQuery, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: variables ? ['SpotWeekRanking', variables] : ['SpotWeekRanking'],
    queryFn: fetcher<RankingQuery, { take?: number }>(
      SpotWeekRankingDocument,
      variables,
    ),
    ...options,
  })
}

export function degreesToCompass(deg: number | null | undefined): string {
  if (deg == null || Number.isNaN(deg)) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return `${dirs[idx]} ${Math.round(deg)}°`
}
