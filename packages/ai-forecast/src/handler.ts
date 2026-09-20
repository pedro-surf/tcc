import './env'
import { ingestSpotMonth } from './forecast/ingestSpotMonth'
import {
  WeeklyDescriptionCooldownError,
  generateAndStoreWeeklySpotDescription,
} from './ai/weeklySpotDescription'
import { runWeeklyForecastJob } from './jobs/runWeeklyForecastJob'
import { requiredString, requiredInt, resolveRequest, authorize, resolveJson } from './helpers'
import { LambdaResponse } from './types'

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

export async function handler(event: unknown = {}): Promise<LambdaResponse> {
  try {
    const { job, body } = resolveRequest(event)
    if (!authorize(event, body)) {
      return resolveJson(401, { error: 'Unauthorized' })
    }

    const result = await runJob(job, body)
    return resolveJson(200, result)
  } catch (error) {
    if (error instanceof WeeklyDescriptionCooldownError) {
      return resolveJson(429, {
        error: error.message,
        nextAvailableAt: error.nextAvailableAt.toISOString(),
      })
    }

    const message = error instanceof Error ? error.message : 'Forecast job failed'
    const status = message.includes('not found') ? 404 : 400
    return resolveJson(status, { error: message })
  }
}
