import axios from 'axios'
import { ForecastSource } from '@prisma/client'
import type {
  ForecastProvider,
  NormalizedForecastPoint,
  ProviderMonthRequest,
  ProviderMonthResult,
} from '../types'
import { surfEnergyKj } from '../monthRange'

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const MARINE_HOURLY = [
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
  'wave_height',
  'wave_direction',
  'wave_period',
  'sea_surface_temperature',
].join(',')

const WIND_HOURLY = 'wind_speed_10m,wind_direction_10m'

type HourlyBlock = {
  time?: string[]
  swell_wave_height?: Array<number | null>
  swell_wave_direction?: Array<number | null>
  swell_wave_period?: Array<number | null>
  wave_height?: Array<number | null>
  wave_direction?: Array<number | null>
  wave_period?: Array<number | null>
  sea_surface_temperature?: Array<number | null>
  wind_speed_10m?: Array<number | null>
  wind_direction_10m?: Array<number | null>
}

type OpenMeteoResponse = {
  error?: boolean
  reason?: string
  hourly?: HourlyBlock
}

function dateParam(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function endDateInclusive(toExclusive: Date): string {
  return new Date(toExclusive.getTime() - 1000).toISOString().slice(0, 10)
}

function pickNumber(
  preferred: Array<number | null> | undefined,
  fallback: Array<number | null> | undefined,
  index: number,
): number | null {
  const value = preferred?.[index] ?? fallback?.[index]
  if (value == null || !Number.isFinite(Number(value))) return null
  return Number(value)
}

function mergeHourly(
  marine: HourlyBlock | undefined,
  weather: HourlyBlock | undefined,
): NormalizedForecastPoint[] {
  const times = marine?.time ?? []
  const windByTime = new Map<string, { wind: number; windDir: number }>()
  for (let i = 0; i < (weather?.time?.length ?? 0); i += 1) {
    const stamp = weather?.time?.[i]
    const wind = weather?.wind_speed_10m?.[i]
    const windDir = weather?.wind_direction_10m?.[i]
    if (!stamp || wind == null || windDir == null) continue
    if (!Number.isFinite(Number(wind)) || !Number.isFinite(Number(windDir))) continue
    windByTime.set(stamp, { wind: Number(wind), windDir: Number(windDir) })
  }

  const points: NormalizedForecastPoint[] = []
  for (let i = 0; i < times.length; i += 1) {
    const stamp = times[i]
    if (!stamp) continue
    const swell = pickNumber(marine?.swell_wave_height, marine?.wave_height, i)
    const swellDir = pickNumber(
      marine?.swell_wave_direction,
      marine?.wave_direction,
      i,
    )
    if (swell == null || swellDir == null) continue

    const period = pickNumber(marine?.swell_wave_period, marine?.wave_period, i)
    const temp = pickNumber(marine?.sea_surface_temperature, undefined, i)
    const wind = windByTime.get(stamp)
    const timestamp = new Date(stamp.endsWith('Z') ? stamp : `${stamp}Z`)
    if (Number.isNaN(timestamp.getTime())) continue

    points.push({
      timestamp,
      swell,
      swellDir,
      period,
      wind: wind?.wind ?? 0,
      windDir: wind?.windDir ?? 0,
      temp,
      energy: surfEnergyKj(swell, period),
    })
  }
  return points
}

async function getJson(url: string, params: Record<string, string>) {
  const { data } = await axios.get<OpenMeteoResponse>(url, {
    params,
    timeout: 60_000,
  })
  if (data?.error) {
    throw new Error(data.reason || 'Open-Meteo returned an error')
  }
  return data
}

export const openMeteoMarineProvider: ForecastProvider = {
  source: ForecastSource.OPEN_METEO_MARINE,
  async fetchMonth(request) {
    const startDate = dateParam(request.range.from)
    const endDate = endDateInclusive(request.range.to)
    const shared = {
      latitude: String(request.lat),
      longitude: String(request.lng),
      start_date: startDate,
      end_date: endDate,
      timezone: 'GMT',
      timeformat: 'iso8601',
    }

    const weatherUrl =
      request.range.kind === 'HISTORY' ? ARCHIVE_URL : FORECAST_URL

    const [marine, weather] = await Promise.all([
      getJson(MARINE_URL, {
        ...shared,
        hourly: MARINE_HOURLY,
        cell_selection: 'sea',
      }),
      getJson(weatherUrl, {
        ...shared,
        hourly: WIND_HOURLY,
        wind_speed_unit: 'kmh',
      }),
    ])

    const points = mergeHourly(marine.hourly, weather.hourly)
    if (points.length === 0) {
      throw new Error('Open-Meteo returned no marine rows for this month')
    }

    return {
      source: ForecastSource.OPEN_METEO_MARINE,
      datasetId: 'open-meteo-marine',
      points,
      rawPayload: { marine, weather },
    } satisfies ProviderMonthResult
  },
}
