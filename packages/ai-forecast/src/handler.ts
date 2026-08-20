export type WeeklyForecastJobResult = {
  ranAt: string
  spotCount: number
  okCount: number
  results: Array<{
    spotId: string
    name: string
    ok: boolean
    error?: string
  }>
}

export type LambdaResponse = {
  statusCode: number
  body: string
}

export async function handler(): Promise<LambdaResponse> {
  const backendUrl = (
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    throw new Error('CRON_SECRET is not configured')
  }

  const response = await fetch(`${backendUrl}/internal/jobs/weekly-forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': secret,
    },
  })

  const text = await response.text()
  let payload: unknown = text
  try {
    payload = JSON.parse(text) as WeeklyForecastJobResult
  } catch {
    payload = { error: text }
  }

  if (!response.ok) {
    throw new Error(
      `Weekly forecast job failed (${response.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`,
    )
  }

  return {
    statusCode: 200,
    body: JSON.stringify(payload),
  }
}
