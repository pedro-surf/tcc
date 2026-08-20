import { Prisma } from '@prisma/client'
import { prisma } from '../graphql/builder'
import { nextWeekRange } from './conditionVector'

export type IdealOrigin = 'SPOT' | 'FORECAST'

export type SpotWeekRankRow = {
  spotId: string
  weekScore: number
  bestScore: number
  bestAt: Date
  matchedOrigin: IdealOrigin
  idealForecastId: string | null
  forecastId: string | null
  forecastCount: number
  idealCount: number
  bestSwell: number
  bestSwellDir: number
  bestWind: number
  bestWindDir: number
}

/**
 * Rank spots for the next 7 days in SQL.
 * Directions use circular distance (angle_diff): 350° is close to 10°,
 * negatives wrap. Magnitudes are a secondary ratio match, same idea as
 * score-spots.sql. Multiple ideals per spot (spot dirs + ideal=true rows)
 * keep the best match per forecast hour.
 */
export async function rankSpotsForWeek(options: {
  spotIds: string[]
  take?: number
  from?: Date
  to?: Date
}): Promise<SpotWeekRankRow[]> {
  if (options.spotIds.length === 0) return []

  const range =
    options.from && options.to
      ? { from: options.from, to: options.to }
      : nextWeekRange()
  const take = Math.min(Math.max(options.take ?? 20, 1), 100)

  const rows = await prisma.$queryRaw<
    Array<{
      spotId: string
      weekScore: number
      bestScore: number
      bestAt: Date
      matchedOrigin: string
      idealForecastId: string | null
      forecastId: string | null
      forecastCount: number
      idealCount: number
      bestSwell: number
      bestSwellDir: number
      bestWind: number
      bestWindDir: number
    }>
  >(Prisma.sql`
    WITH ideals AS (
      SELECT
        s.id AS "spotId",
        2.0::float8 AS swell,
        COALESCE(s."idealSwellDir", 180)::float8 AS "swellDir",
        10.0::float8 AS wind,
        COALESCE(s."idealWindDir", 0)::float8 AS "windDir",
        'SPOT'::text AS origin,
        NULL::text AS "idealForecastId"
      FROM "Spot" s
      WHERE s.id IN (${Prisma.join(options.spotIds)})
        AND (s."idealWindDir" IS NOT NULL OR s."idealSwellDir" IS NOT NULL)

      UNION ALL

      SELECT
        f."spotId",
        f.swell,
        f."swellDir",
        f.wind,
        f."windDir",
        'FORECAST'::text AS origin,
        f.id AS "idealForecastId"
      FROM "SpotForecast" f
      WHERE f.ideal = TRUE
        AND f."spotId" IN (${Prisma.join(options.spotIds)})
    ),
    forecasts AS (
      SELECT
        f.id,
        f."spotId",
        f.timestamp,
        f.swell,
        f."swellDir",
        f.wind,
        f."windDir"
      FROM "SpotForecast" f
      WHERE f.ideal = FALSE
        AND f."spotId" IN (${Prisma.join(options.spotIds)})
        AND f.timestamp >= ${range.from}
        AND f.timestamp < ${range.to}
    ),
    scored AS (
      SELECT
        f."spotId",
        f.timestamp,
        f.id AS "forecastId",
        i.origin,
        i."idealForecastId",
        (
          EXP(-(POWER(angle_diff(f."swellDir", i."swellDir"), 2)) / (2 * 40 * 40))
            * LEAST(f.swell / NULLIF(i.swell, 0), 1.0) * 0.40
          + CASE
              WHEN f.swell <= i.swell THEN f.swell / NULLIF(i.swell, 0)
              ELSE i.swell / NULLIF(f.swell, 0)
            END * 0.25
          + EXP(-(POWER(angle_diff(f."windDir", i."windDir"), 2)) / (2 * 30 * 30))
            * LEAST(f.wind / NULLIF(i.wind, 0), 1.0) * 0.20
          + CASE
              WHEN f.wind <= i.wind THEN f.wind / NULLIF(i.wind, 0)
              ELSE i.wind / NULLIF(f.wind, 0)
            END * 0.15
        ) * 100 AS score,
        f.swell,
        f."swellDir",
        f.wind,
        f."windDir"
      FROM forecasts f
      JOIN ideals i ON i."spotId" = f."spotId"
    ),
    hourly AS (
      SELECT DISTINCT ON ("spotId", timestamp)
        *
      FROM scored
      ORDER BY "spotId", timestamp, score DESC
    ),
    agg AS (
      SELECT
        "spotId",
        AVG(score) AS week_score,
        MAX(score) AS best_score,
        COUNT(*)::int AS forecast_count
      FROM hourly
      GROUP BY "spotId"
    ),
    best AS (
      SELECT DISTINCT ON ("spotId")
        "spotId",
        timestamp,
        "forecastId",
        origin,
        "idealForecastId",
        score,
        swell,
        "swellDir",
        wind,
        "windDir"
      FROM hourly
      ORDER BY "spotId", score DESC, timestamp ASC
    )
    SELECT
      a."spotId" AS "spotId",
      a.week_score AS "weekScore",
      a.best_score AS "bestScore",
      b.timestamp AS "bestAt",
      b.origin AS "matchedOrigin",
      b."idealForecastId" AS "idealForecastId",
      b."forecastId" AS "forecastId",
      a.forecast_count AS "forecastCount",
      (
        SELECT COUNT(*)::int FROM ideals i WHERE i."spotId" = a."spotId"
      ) AS "idealCount",
      b.swell AS "bestSwell",
      b."swellDir" AS "bestSwellDir",
      b.wind AS "bestWind",
      b."windDir" AS "bestWindDir"
    FROM agg a
    JOIN best b ON b."spotId" = a."spotId"
    ORDER BY "weekScore" DESC, "bestScore" DESC
    LIMIT ${take}
  `)

  return rows.map((row) => ({
    ...row,
    weekScore: Number(row.weekScore),
    bestScore: Number(row.bestScore),
    bestSwell: Number(row.bestSwell),
    bestSwellDir: Number(row.bestSwellDir),
    bestWind: Number(row.bestWind),
    bestWindDir: Number(row.bestWindDir),
    matchedOrigin: row.matchedOrigin === 'FORECAST' ? 'FORECAST' : 'SPOT',
  }))
}
