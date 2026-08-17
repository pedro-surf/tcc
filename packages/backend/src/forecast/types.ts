import type { ForecastFetchKind, ForecastSource } from '@prisma/client'

export type MonthRange = {
  year: number
  month: number
  from: Date
  to: Date
  kind: ForecastFetchKind
}

export type NormalizedForecastPoint = {
  timestamp: Date
  swell: number
  swellDir: number
  period: number | null
  wind: number
  windDir: number
  temp: number | null
  energy: number | null
}

export type ProviderMonthRequest = {
  spotId: string
  lat: number
  lng: number
  range: MonthRange
}

export type ProviderMonthResult = {
  source: ForecastSource
  datasetId: string | null
  points: NormalizedForecastPoint[]
  rawPayload: unknown
}

export interface ForecastProvider {
  readonly source: ForecastSource
  fetchMonth(request: ProviderMonthRequest): Promise<ProviderMonthResult>
}
