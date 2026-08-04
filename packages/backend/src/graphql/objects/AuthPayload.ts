import { builder, prisma } from '../builder'
import { UserRef } from './User'

export const AuthPayloadRef = builder.objectRef<{
  token: string
  userId: string
}>('AuthPayload')

AuthPayloadRef.implement({
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.prismaField({
      type: UserRef,
      resolve: (query, parent) =>
        prisma.user.findUniqueOrThrow({
          ...query,
          where: { id: parent.userId },
        }),
    }),
  }),
})
