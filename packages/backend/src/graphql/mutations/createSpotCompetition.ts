import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SpotCompetitionRef } from '../objects/SpotCompetition'

const SpotCompetitionCreateInput = builder.inputType(
  'SpotCompetitionCreateInput',
  {
    fields: (t) => ({
      spotId: t.string({ required: true }),
      name: t.string({ required: true }),
      description: t.string(),
      date: t.field({ type: 'DateTime', required: true }),
    }),
  },
)

builder.mutationField('createSpotCompetition', (t) =>
  t.prismaField({
    type: SpotCompetitionRef,
    args: {
      data: t.arg({ type: SpotCompetitionCreateInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const name = args.data.name.trim()
      if (!name) throw new GraphQLError('Name is required')

      const spot = await prisma.spot.findUnique({
        where: { id: args.data.spotId },
        select: { id: true },
      })
      if (!spot) throw new GraphQLError('Spot not found')

      return prisma.spotCompetition.create({
        ...query,
        data: {
          spotId: args.data.spotId,
          name,
          description: args.data.description?.trim() || null,
          date: new Date(args.data.date),
          createdById: user.id,
        },
      })
    },
  }),
)
