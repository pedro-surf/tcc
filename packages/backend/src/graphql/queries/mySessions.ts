import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SessionRef } from '../objects/Session'

builder.queryField('mySessions', (t) =>
  t.prismaField({
    type: [SessionRef],
    resolve: (query, _root, _args, ctx: Context) => {
      const user = requireUser(ctx)
      return prisma.session.findMany({
        ...query,
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)
