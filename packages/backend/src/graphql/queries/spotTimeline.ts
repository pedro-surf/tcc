import { builder, prisma } from '../builder'
import { SpotCheckRef } from '../objects/SpotCheck'
import { SpotCompetitionRef } from '../objects/SpotCompetition'

builder.queryField('spotChecksBySpot', (t) =>
  t.prismaField({
    type: [SpotCheckRef],
    args: {
      spotId: t.arg.string({ required: true }),
      take: t.arg.int(),
      skip: t.arg.int(),
    },
    resolve: async (query, _root, args) =>
      prisma.spotCheck.findMany({
        ...query,
        where: { spotId: args.spotId },
        orderBy: { timestamp: 'desc' },
        take: args.take ?? 50,
        skip: args.skip ?? 0,
      }),
  }),
)

builder.queryField('spotCompetitionsBySpot', (t) =>
  t.prismaField({
    type: [SpotCompetitionRef],
    args: {
      spotId: t.arg.string({ required: true }),
      take: t.arg.int(),
      skip: t.arg.int(),
    },
    resolve: async (query, _root, args) =>
      prisma.spotCompetition.findMany({
        ...query,
        where: { spotId: args.spotId },
        orderBy: { date: 'asc' },
        take: args.take ?? 50,
        skip: args.skip ?? 0,
      }),
  }),
)
