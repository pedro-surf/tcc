import { builder, prisma } from '../builder'
import { SpotForecastRef } from '../objects/SpotForecast'

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
    },
    resolve: async (query, _root, args) => {
      // TODO(ai-vectors): fetch candidate forecasts from vector index by spot embedding
      // and re-rank / filter before returning. Keep this field name stable for the web client.
      return prisma.spotForecast.findMany({
        ...query,
        where: { spotId: args.spotId },
        orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
        take: args.take ?? 24,
        skip: args.skip ?? 0,
      })
    },
  }),
)
