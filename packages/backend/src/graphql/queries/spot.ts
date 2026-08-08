import { builder, prisma } from '../builder'
import { SpotRef } from '../objects/Spot'

builder.queryField('spot', (t) =>
  t.prismaField({
    type: SpotRef,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args) =>
      prisma.spot.findUnique({
        ...query,
        where: { id: String(args.id) },
      }),
  }),
)
