import { LambdaResponse } from "./types"

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function resolveJson(statusCode: number, payload: unknown): LambdaResponse {
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

export function authorize(
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

export function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${key} is required`)
  }
  return value
}

export function requiredInt(body: Record<string, unknown>, key: string): number {
  const value = body[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer`)
  }
  return parsed
}

export function resolveRequest(event: unknown): { job: string; body: Record<string, unknown> } {
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
