import { builder, prisma } from '../builder'
import { UserRef } from '../objects/User'
import type { Context } from '../context'

builder.queryField('me', (t) =>
  t.prismaField({
    type: UserRef,
    nullable: true,
    resolve: async (query, _root, _args, ctx: Context) => {
      if (!ctx.user) return null
      return prisma.user.findUnique({
        ...query,
        where: { id: ctx.user.id },
      })
    },
  }),
)
