import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SessionRef } from '../objects/Session'

builder.queryField('session', (t) =>
  t.prismaField({
    type: SessionRef,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      return prisma.session.findFirst({
        ...query,
        where: { id: args.id, userId: user.id },
      })
    },
  }),
)
