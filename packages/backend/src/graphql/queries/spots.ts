import { builder, prisma } from '../builder'
import type { Context } from '../context'
import { SpotRef } from '../objects/Spot'
import { spotVisibilityWhere } from '../utils/spotVisibility'

builder.queryField('spots', (t) =>
  t.prismaField({
    type: [SpotRef],
    args: {
      skip: t.arg.int(),
      take: t.arg.int(),
      name: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const visibility = await spotVisibilityWhere(ctx)
      const name = args.name?.trim()

      return prisma.spot.findMany({
        ...query,
        where: {
          AND: [
            visibility,
            name ? { name: { contains: name, mode: 'insensitive' } } : {},
          ],
        },
        skip: args.skip ?? undefined,
        take: args.take ?? undefined,
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)
