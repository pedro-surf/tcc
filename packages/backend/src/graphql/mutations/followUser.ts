import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { FollowerRef } from '../objects/Follower'
import { UserRef } from '../objects/User'

builder.mutationField('followUser', (t) =>
  t.prismaField({
    type: FollowerRef,
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const me = requireUser(ctx)
      if (me.id === args.userId) {
        throw new GraphQLError('You cannot follow yourself')
      }

      const target = await prisma.user.findUnique({
        where: { id: args.userId },
        select: { id: true },
      })
      if (!target) throw new GraphQLError('User not found')

      return prisma.follower.upsert({
        ...query,
        where: {
          followerId_followingId: {
            followerId: me.id,
            followingId: args.userId,
          },
        },
        create: {
          followerId: me.id,
          followingId: args.userId,
        },
        update: {},
      })
    },
  }),
)

builder.mutationField('unfollowUser', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      const me = requireUser(ctx)
      await prisma.follower.deleteMany({
        where: {
          followerId: me.id,
          followingId: args.userId,
        },
      })
      return true
    },
  }),
)

builder.queryField('myFriends', (t) =>
  t.prismaField({
    type: [UserRef],
    resolve: async (query, _root, _args, ctx: Context) => {
      const me = requireUser(ctx)
      const rows = await prisma.follower.findMany({
        where: { followerId: me.id },
        select: { followingId: true },
      })
      const ids = rows.map((r) => r.followingId)
      if (ids.length === 0) return []
      return prisma.user.findMany({
        ...query,
        where: { id: { in: ids } },
        orderBy: { name: 'asc' },
      })
    },
  }),
)
