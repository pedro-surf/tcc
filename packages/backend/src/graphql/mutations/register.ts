import { GraphQLError } from 'graphql'
import { hashPassword } from '../../auth/password'
import { signAuthToken } from '../../auth/jwt'
import { builder, prisma } from '../builder'
import { AuthPayloadRef } from '../objects/AuthPayload'

builder.mutationField('register', (t) =>
  t.field({
    type: AuthPayloadRef,
    args: {
      name: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const name = args.name.trim()
      const email = args.email.trim().toLowerCase()
      const password = args.password

      if (!name) {
        throw new GraphQLError('Name is required')
      }
      if (!email.includes('@')) {
        throw new GraphQLError('A valid email is required')
      }
      if (password.length < 6) {
        throw new GraphQLError('Password must be at least 6 characters')
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        throw new GraphQLError('Email is already registered')
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(password),
        },
      })

      const token = signAuthToken({ sub: user.id, email: user.email })
      return { token, userId: user.id }
    },
  }),
)
