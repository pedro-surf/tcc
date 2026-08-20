import type { ForecastFetchKind, ForecastSource, Prisma } from '@prisma/client'
import { prisma } from '../graphql/builder'
import { resolveMonthRange } from './monthRange'
import { getForecastProvider } from './providers'
import { encodeConditionVector } from './conditionVector'

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

function timestampKey(value: Date): string {
  return value.toISOString()
}

export async function ingestSpotMonth(options: {
  spotId: string
  year: number
  month: number
  requestedById: string
  force?: boolean
  allowUpcoming?: boolean
}): Promise<IngestSpotMonthResult> {
  const range = resolveMonthRange(options.year, options.month, new Date(), {
    allowUpcoming: options.allowUpcoming,
  })
  const spot = await prisma.spot.findUnique({
    where: { id: options.spotId },
    select: { id: true, lat: true, lng: true, locationId: true },
  })
  if (!spot) throw new Error('Spot not found')

  const cached = options.force
    ? null
    : await prisma.spotForecastFetch.findFirst({
        where: {
          spotId: spot.id,
          year: range.year,
          month: range.month,
        },
        orderBy: { fetchedAt: 'desc' },
      })
  if (cached) {
    return {
      spotId: spot.id,
      year: cached.year,
      month: cached.month,
      kind: cached.kind,
      source: cached.source,
      fromCache: true,
      from: cached.from,
      to: cached.to,
      fetchId: cached.id,
    }
  }

  const provider = getForecastProvider()
  const fetched = await provider.fetchMonth({
    spotId: spot.id,
    lat: spot.lat,
    lng: spot.lng,
    range,
  })

  const stored = await prisma.$transaction(async (tx) => {
    if (options.force) {
      await tx.spotForecast.deleteMany({
        where: {
          spotId: spot.id,
          ideal: false,
          timestamp: { gte: range.from, lt: range.to },
        },
      })
      await tx.spotForecastFetch.deleteMany({
        where: {
          spotId: spot.id,
          year: range.year,
          month: range.month,
        },
      })
    }

    const created = await tx.spotForecastFetch.create({
      data: {
        spotId: spot.id,
        source: fetched.source,
        kind: range.kind,
        year: range.year,
        month: range.month,
        from: range.from,
        to: range.to,
        lat: spot.lat,
        lng: spot.lng,
        datasetId: fetched.datasetId,
        rawPayload: fetched.rawPayload as Prisma.InputJsonValue,
        requestedById: options.requestedById,
      },
    })

    const existing = await tx.spotForecast.findMany({
      where: {
        spotId: spot.id,
        timestamp: { gte: range.from, lt: range.to },
      },
      select: { timestamp: true },
    })
    const seen = new Set(
      existing
        .map((row) => row.timestamp)
        .filter((value): value is Date => Boolean(value))
        .map(timestampKey),
    )

    const rows: Prisma.SpotForecastCreateManyInput[] = []
    for (const point of fetched.points) {
      const key = timestampKey(point.timestamp)
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        spotId: spot.id,
        locationId: spot.locationId,
        userId: options.requestedById,
        fetchId: created.id,
        source: fetched.source,
        ideal: false,
        swell: point.swell,
        swellDir: point.swellDir,
        wind: point.wind,
        windDir: point.windDir,
        period: point.period,
        energy: point.energy,
        temp: point.temp,
        timestamp: point.timestamp,
        conditionVec: encodeConditionVector({
          swell: point.swell,
          swellDir: point.swellDir,
          wind: point.wind,
          windDir: point.windDir,
          period: point.period,
        }),
      })
    }

    if (rows.length > 0) {
      await tx.spotForecast.createMany({ data: rows, skipDuplicates: true })
    }

    return created
  })

  return {
    spotId: spot.id,
    year: range.year,
    month: range.month,
    kind: range.kind,
    source: fetched.source,
    fromCache: false,
    from: range.from,
    to: range.to,
    fetchId: stored.id,
  }
}
