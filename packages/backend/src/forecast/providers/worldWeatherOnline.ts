import axios from 'axios'
import { ForecastSource } from '@prisma/client'
import type {
  ForecastProvider,
  NormalizedForecastPoint,
  ProviderMonthRequest,
  ProviderMonthResult,
} from '../types'
import { surfEnergyKj } from '../monthRange'

type WwoHourly = {
  time?: string
  swellHeight_m?: string
  swellDir?: string
  swellPeriod_secs?: string
  windspeedKmph?: string
  winddirDegree?: string
  waterTemp_C?: string
}

type WwoDay = {
  date?: string
  hourly?: WwoHourly[]
}

function buildTimestamp(dateStr: string, timeStr: string | undefined): Date | null {
  const hour = Number.parseInt(String(timeStr ?? '0'), 10) / 100
  if (!dateStr || Number.isNaN(hour)) return null
  const date = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCHours(hour)
  return date
}

function flattenWeather(weather: WwoDay[]): NormalizedForecastPoint[] {
  const points: NormalizedForecastPoint[] = []
  for (const day of weather) {
    if (!day.date) continue
    for (const hour of day.hourly ?? []) {
      const timestamp = buildTimestamp(day.date, hour.time)
      const swell = Number(hour.swellHeight_m)
      const swellDir = Number(hour.swellDir)
      const wind = Number(hour.windspeedKmph)
      const windDir = Number(hour.winddirDegree)
      if (!timestamp || !Number.isFinite(swell) || !Number.isFinite(swellDir)) continue
      const periodRaw = Number(hour.swellPeriod_secs)
      const period = Number.isFinite(periodRaw) ? periodRaw : null
      const tempRaw = Number(hour.waterTemp_C)
      points.push({
        timestamp,
        swell,
        swellDir,
        period,
        wind: Number.isFinite(wind) ? wind : 0,
        windDir: Number.isFinite(windDir) ? windDir : 0,
        temp: Number.isFinite(tempRaw) ? tempRaw : null,
        energy: surfEnergyKj(swell, period),
      })
    }
  }
  return points
}

export const worldWeatherOnlineProvider: ForecastProvider = {
  source: ForecastSource.WORLD_WEATHER_ONLINE,
  async fetchMonth(request) {
    const apiKey = process.env.WWO_API_KEY
    if (!apiKey) {
      throw new Error('WWO_API_KEY is not configured')
    }

    const isHistory = request.range.kind === 'HISTORY'
    const url = isHistory
      ? 'https://api.worldweatheronline.com/premium/v1/past-marine.ashx'
      : 'https://api.worldweatheronline.com/premium/v1/marine.ashx'

    const date = request.range.from.toISOString().slice(0, 10)
    const enddate = new Date(request.range.to.getTime() - 1000)
      .toISOString()
      .slice(0, 10)

    const params: Record<string, string | number> = {
      key: apiKey,
      format: 'json',
      q: `${request.lat},${request.lng}`,
      tide: 'yes',
      tp: 3,
    }
    if (isHistory) {
      params.date = date
      params.enddate = enddate
    }

    const { data } = await axios.get(url, { params, timeout: 60_000 })
    const weather = (data?.data?.weather ?? []) as WwoDay[]
    if (!Array.isArray(weather) || weather.length === 0) {
      const apiError = data?.data?.error?.[0]?.msg
      throw new Error(apiError || 'World Weather Online returned no marine rows')
    }

    return {
      source: ForecastSource.WORLD_WEATHER_ONLINE,
      datasetId: isHistory ? 'past-marine.ashx' : 'marine.ashx',
      points: flattenWeather(weather),
      rawPayload: data,
    } satisfies ProviderMonthResult
  },
}
