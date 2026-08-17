import { builder, prisma } from '../builder'
import { CompetitionHeatRef } from '../objects/CompetitionHeat'
import { SpotCompetitionRef } from '../objects/SpotCompetition'

builder.queryField('events', (t) =>
  t.prismaField({
    type: [SpotCompetitionRef],
    args: {
      take: t.arg.int(),
      skip: t.arg.int(),
    },
    resolve: async (query, _root, args) =>
      prisma.spotCompetition.findMany({
        ...query,
        orderBy: { date: 'desc' },
        take: args.take ?? 50,
        skip: args.skip ?? 0,
      }),
  }),
)

builder.queryField('spotCompetition', (t) =>
  t.prismaField({
    type: SpotCompetitionRef,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args) =>
      prisma.spotCompetition.findUnique({
        ...query,
        where: { id: String(args.id) },
      }),
  }),
)

builder.queryField('heat', (t) =>
  t.prismaField({
    type: CompetitionHeatRef,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args) =>
      prisma.competitionHeat.findUnique({
        ...query,
        where: { id: String(args.id) },
      }),
  }),
)
