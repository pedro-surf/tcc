import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { SpotForecastRef } from '../objects/SpotForecast'
import { utcMonthRange } from '../../forecast/monthRange'

/**
 * Spot forecasts for a break.
 * Today: DB rows for the spot.
 * Later: replace/order via AI vector similarity (ideal conditions embeddings).
 */
builder.queryField('spotForecastsBySpot', (t) =>
  t.prismaField({
    type: [SpotForecastRef],
    args: {
      spotId: t.arg.string({ required: true }),
      take: t.arg.int(),
      skip: t.arg.int(),
      year: t.arg.int(),
      month: t.arg.int(),
    },
    resolve: async (query, _root, args) => {
      // TODO(ai-vectors): fetch candidate forecasts from vector index by spot embedding
      // and re-rank / filter before returning. Keep this field name stable for the web client.
      let monthFilter: { from: Date; to: Date } | null = null
      if (args.year != null && args.month != null) {
        try {
          monthFilter = utcMonthRange(args.year, args.month)
        } catch (error) {
          throw new GraphQLError(
            error instanceof Error ? error.message : 'Invalid month',
          )
        }
      }

      return prisma.spotForecast.findMany({
        ...query,
        where: {
          spotId: args.spotId,
          ...(monthFilter
            ? { timestamp: { gte: monthFilter.from, lt: monthFilter.to } }
            : {}),
        },
        orderBy: monthFilter
          ? [{ timestamp: 'asc' }, { createdAt: 'asc' }]
          : [{ timestamp: 'desc' }, { createdAt: 'desc' }],
        take: args.take ?? (monthFilter ? 500 : 24),
        skip: args.skip ?? 0,
      })
    },
  }),
)
