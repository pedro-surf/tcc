import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import type { Context } from '../context'
import {
  SpotForecastCalendarMonthRef,
  SpotForecastMonthRef,
} from '../objects/SpotForecastMonth'
import { canViewSpot } from '../utils/spotVisibility'
import { resolveMonthRange } from '../../forecast/monthRange'

async function requireVisibleSpot(spotId: string, ctx: Context) {
  const access = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { id: true, secret: true, createdById: true },
  })
  if (!access || !(await canViewSpot(access, ctx))) {
    throw new GraphQLError('Spot not found')
  }
  return access
}

builder.queryField('spotForecastMonth', (t) =>
  t.field({
    type: SpotForecastMonthRef,
    nullable: true,
    args: {
      spotId: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      await requireVisibleSpot(args.spotId, ctx)
      let range
      try {
        range = resolveMonthRange(args.year, args.month)
      } catch (error) {
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Invalid month',
        )
      }

      const fetch = await prisma.spotForecastFetch.findFirst({
        where: {
          spotId: args.spotId,
          year: range.year,
          month: range.month,
        },
        orderBy: { fetchedAt: 'desc' },
      })
      if (!fetch) return null

      return {
        spotId: args.spotId,
        year: fetch.year,
        month: fetch.month,
        kind: fetch.kind,
        source: fetch.source,
        fromCache: true,
        from: fetch.from,
        to: fetch.to,
        fetchId: fetch.id,
      }
    },
  }),
)

builder.queryField('spotForecastCalendar', (t) =>
  t.field({
    type: [SpotForecastCalendarMonthRef],
    args: {
      spotId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      await requireVisibleSpot(args.spotId, ctx)

      const fetches = await prisma.spotForecastFetch.findMany({
        where: { spotId: args.spotId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })

      const months = await Promise.all(
        fetches.map(async (fetch) => {
          const rowCount = await prisma.spotForecast.count({
            where: {
              spotId: args.spotId,
              timestamp: { gte: fetch.from, lt: fetch.to },
            },
          })
          return {
            year: fetch.year,
            month: fetch.month,
            source: fetch.source,
            kind: fetch.kind,
            fetchedAt: fetch.fetchedAt,
            rowCount,
          }
        }),
      )

      return months
    },
  }),
)
