import { GraphQLError } from 'graphql'
import { verifyPassword } from '../../auth/password'
import { signAuthToken } from '../../auth/jwt'
import { builder, prisma } from '../builder'
import { AuthPayloadRef } from '../objects/AuthPayload'

builder.mutationField('login', (t) =>
  t.field({
    type: AuthPayloadRef,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const email = args.email.trim().toLowerCase()
      const user = await prisma.user.findUnique({ where: { email } })

      if (!user) {
        throw new GraphQLError('Invalid email or password')
      }

      const valid = await verifyPassword(args.password, user.password)
      if (!valid) {
        throw new GraphQLError('Invalid email or password')
      }

      const token = signAuthToken({ sub: user.id, email: user.email })
      return { token, userId: user.id }
    },
  }),
)
