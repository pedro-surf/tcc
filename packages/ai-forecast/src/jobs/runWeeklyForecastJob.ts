import type { Spot } from '@prisma/client'
import { prisma } from '../db'
import { generateAndStoreWeeklySpotDescription } from '../ai/weeklySpotDescription'
import { ingestSpotMonth } from '../forecast/ingestSpotMonth'
import { monthsForNextWeek } from '../forecast/monthRange'

export type WeeklyJobSpotResult = {
  spotId: string
  name: string
  ok: boolean
  forecast?: Array<{ year: number; month: number; fromCache: boolean }>
  error?: string
}

export type WeeklyForecastJobResult = {
  ranAt: string
  spotCount: number
  okCount: number
  results: WeeklyJobSpotResult[]
}

async function runWeeklyForecastForSpot(
  spot: Spot,
  months: Array<{ year: number; month: number }>,
  ingestUserId: string | undefined,
): Promise<WeeklyJobSpotResult> {
  const requestedById = spot.createdById || ingestUserId
  if (!requestedById) {
    return {
      spotId: spot.id,
      name: spot.name,
      ok: false,
      error:
        'No user to attribute forecast rows. Set FORECAST_INGEST_USER_ID or createdById on the spot.',
    }
  }

  try {
    const forecast: WeeklyJobSpotResult['forecast'] = []
    for (const { year, month } of months) {
      const ingested = await ingestSpotMonth({
        spotId: spot.id,
        year,
        month,
        requestedById,
        force: true,
        allowUpcoming: true,
        spot,
      })
      forecast.push({
        year: ingested.year,
        month: ingested.month,
        fromCache: ingested.fromCache,
      })
    }

    await generateAndStoreWeeklySpotDescription(spot.id, {
      skipCooldown: true,
      spot,
    })

    return {
      spotId: spot.id,
      name: spot.name,
      ok: true,
      forecast,
    }
  } catch (error) {
    return {
      spotId: spot.id,
      name: spot.name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function runWeeklyForecastJob(): Promise<WeeklyForecastJobResult> {
  const ingestUserId = process.env.FORECAST_INGEST_USER_ID
  const months = monthsForNextWeek()
  const spots = await prisma.spot.findMany({
    where: { secret: { not: true } },
    orderBy: { createdAt: 'asc' },
  })

  const results: WeeklyJobSpotResult[] = []
  for (const spot of spots) {
    results.push(await runWeeklyForecastForSpot(spot, months, ingestUserId))
  }

  return {
    ranAt: new Date().toISOString(),
    spotCount: spots.length,
    okCount: results.filter((row) => row.ok).length,
    results,
  }
}
