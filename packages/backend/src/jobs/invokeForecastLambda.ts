import axios from 'axios'
import type { ForecastFetchKind, ForecastSource } from '@prisma/client'

export type ForecastJob = 'weekly-forecast' | 'ingest-month' | 'weekly-description'

export class ForecastLambdaError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ForecastLambdaError'
    this.status = status
    this.payload = payload
  }
}

export type IngestSpotMonthResult = {
  spotId: string
  year: number
  month: number
  kind: ForecastFetchKind
  source: ForecastSource
  fromCache: boolean
  from: Date
  to: Date
  fetchId: string
}

export type WeeklyDescriptionJobResult = {
  id: string
  weeklyGeneratedDescription: string | null
  weeklyGeneratedAt: Date | null
}

const DEFAULT_LAMBDA_URL = 'http://localhost:4000'

function lambdaBaseUrl(): string {
  return (
    process.env.FORECAST_LAMBDA_URL ||
    process.env.FORECAST_LAMBDA_ENDPOINT ||
    DEFAULT_LAMBDA_URL
  ).replace(/\/$/, '')
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error: unknown }).error
    if (typeof error === 'string' && error.trim()) return error
  }
  return fallback
}

export async function invokeForecastLambda<T>(
  job: ForecastJob,
  payload: Record<string, unknown> = {},
  options?: { timeoutMs?: number },
): Promise<T> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    throw new Error('CRON_SECRET is not configured')
  }

  const url = `${lambdaBaseUrl()}/jobs/${job}`
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': secret,
      },
      timeout: options?.timeoutMs ?? 120_000,
      validateStatus: () => true,
    })

    const data = response.data as T
    if (response.status >= 400) {
      throw new ForecastLambdaError(
        response.status,
        errorMessage(data, `Forecast lambda failed (${response.status})`),
        data,
      )
    }
    return data
  } catch (error) {
    if (error instanceof ForecastLambdaError) throw error
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      throw new Error(
        `Forecast lambda is not reachable at ${lambdaBaseUrl()}. Start it with pnpm -F @thesis/ai-forecast dev`,
      )
    }
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.message || `Forecast lambda request failed for ${job}`,
      )
    }
    throw error
  }
}

export async function invokeIngestSpotMonth(input: {
  spotId: string
  year: number
  month: number
  requestedById: string
  force?: boolean
  allowUpcoming?: boolean
}): Promise<IngestSpotMonthResult> {
  const raw = await invokeForecastLambda<IngestSpotMonthResult>(
    'ingest-month',
    input,
    { timeoutMs: 120_000 },
  )
  return {
    ...raw,
    from: new Date(raw.from),
    to: new Date(raw.to),
  }
}

export async function invokeWeeklyDescription(input: {
  spotId: string
  skipCooldown?: boolean
}): Promise<WeeklyDescriptionJobResult> {
  const raw = await invokeForecastLambda<WeeklyDescriptionJobResult>(
    'weekly-description',
    input,
    { timeoutMs: 90_000 },
  )
  return {
    ...raw,
    weeklyGeneratedAt: raw.weeklyGeneratedAt
      ? new Date(raw.weeklyGeneratedAt)
      : null,
  }
}

export function invokeWeeklyForecastJob() {
  return invokeForecastLambda('weekly-forecast', {}, { timeoutMs: 280_000 })
}
