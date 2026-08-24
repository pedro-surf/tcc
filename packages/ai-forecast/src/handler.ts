import './env'
import { ingestSpotMonth } from './forecast/ingestSpotMonth'
import {
  WeeklyDescriptionCooldownError,
  generateAndStoreWeeklySpotDescription,
} from './ai/weeklySpotDescription'
import { runWeeklyForecastJob } from './jobs/runWeeklyForecastJob'

export type ForecastJob = 'weekly-forecast' | 'ingest-month' | 'weekly-description'

export type LambdaResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function json(statusCode: number, payload: unknown): LambdaResponse {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isScheduledEvent(event: unknown): boolean {
  return isRecord(event) && event.source === 'aws.events'
}

function isHttpEvent(event: unknown): boolean {
  if (!isRecord(event)) return false
  if (typeof event.httpMethod === 'string') return true
  const context = event.requestContext
  return isRecord(context) && (isRecord(context.http) || typeof context.httpMethod === 'string')
}

function getHeader(event: Record<string, unknown>, name: string): string | undefined {
  const headers = isRecord(event.headers) ? event.headers : {}
  const match = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )
  const value = match?.[1]
  return typeof value === 'string' ? value : undefined
}

function parseBody(event: Record<string, unknown>): Record<string, unknown> {
  if (typeof event.body === 'string' && event.body.length > 0) {
    return JSON.parse(event.body) as Record<string, unknown>
  }
  if (isRecord(event.body)) return event.body
  return {}
}

function jobFromPath(event: Record<string, unknown>): string | undefined {
  const params = isRecord(event.pathParameters) ? event.pathParameters : {}
  if (typeof params.job === 'string' && params.job.length > 0) return params.job

  const rawPath =
    (typeof event.rawPath === 'string' && event.rawPath) ||
    (typeof event.path === 'string' && event.path) ||
    ''
  const parts = rawPath.split('/').filter(Boolean)
  const jobsIndex = parts.lastIndexOf('jobs')
  if (jobsIndex >= 0 && parts[jobsIndex + 1]) return parts[jobsIndex + 1]
  return parts[parts.length - 1]
}

function authorize(
  event: unknown,
  body: Record<string, unknown>,
): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  if (isScheduledEvent(event)) return true
  if (isHttpEvent(event) && isRecord(event)) {
    return getHeader(event, 'x-cron-secret') === secret
  }
  return body.secret === secret
}

function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${key} is required`)
  }
  return value
}

function requiredInt(body: Record<string, unknown>, key: string): number {
  const value = body[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer`)
  }
  return parsed
}

async function runJob(job: string, body: Record<string, unknown>) {
  switch (job) {
    case 'weekly-forecast':
      return runWeeklyForecastJob()
    case 'ingest-month':
      return ingestSpotMonth({
        spotId: requiredString(body, 'spotId'),
        year: requiredInt(body, 'year'),
        month: requiredInt(body, 'month'),
        requestedById: requiredString(body, 'requestedById'),
        force: Boolean(body.force),
        allowUpcoming: Boolean(body.allowUpcoming),
      })
    case 'weekly-description': {
      const spot = await generateAndStoreWeeklySpotDescription(
        requiredString(body, 'spotId'),
        { skipCooldown: Boolean(body.skipCooldown) },
      )
      return {
        id: spot.id,
        weeklyGeneratedDescription: spot.weeklyGeneratedDescription,
        weeklyGeneratedAt: spot.weeklyGeneratedAt,
      }
    }
    default:
      throw new Error(`Unknown job: ${job}`)
  }
}

function resolveRequest(event: unknown): { job: string; body: Record<string, unknown> } {
  if (isScheduledEvent(event)) {
    return { job: 'weekly-forecast', body: {} }
  }

  if (isHttpEvent(event) && isRecord(event)) {
    const job = jobFromPath(event)
    if (!job) throw new Error('Missing job path')
    return { job, body: parseBody(event) }
  }

  if (isRecord(event) && typeof event.job === 'string') {
    const { job, ...rest } = event
    return { job, body: rest }
  }

  throw new Error('Unrecognized event; expected HTTP, schedule, or { job }')
}

export async function handler(event: unknown = {}): Promise<LambdaResponse> {
  try {
    const { job, body } = resolveRequest(event)
    if (!authorize(event, body)) {
      return json(401, { error: 'Unauthorized' })
    }

    const result = await runJob(job, body)
    return json(200, result)
  } catch (error) {
    if (error instanceof WeeklyDescriptionCooldownError) {
      return json(429, {
        error: error.message,
        nextAvailableAt: error.nextAvailableAt.toISOString(),
      })
    }

    const message = error instanceof Error ? error.message : 'Forecast job failed'
    const status = message.includes('not found') ? 404 : 400
    return json(status, { error: message })
  }
}
