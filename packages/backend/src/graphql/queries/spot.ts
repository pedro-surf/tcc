import { builder, prisma } from '../builder'
import type { Context } from '../context'
import { SpotRef } from '../objects/Spot'
import { canViewSpot } from '../utils/spotVisibility'

builder.queryField('spot', (t) =>
  t.prismaField({
    type: SpotRef,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const access = await prisma.spot.findUnique({
        where: { id: String(args.id) },
        select: { id: true, secret: true, createdById: true },
      })
      if (!access || !(await canViewSpot(access, ctx))) return null

      return prisma.spot.findUnique({
        ...query,
        where: { id: access.id },
      })
    },
  }),
)
