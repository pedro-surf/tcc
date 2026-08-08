import { builder } from '../builder'

export const FollowerRef = builder.prismaObject('Follower', {
  fields: (t) => ({
    id: t.exposeID('id'),
    followerId: t.exposeString('followerId'),
    followingId: t.exposeString('followingId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    follower: t.relation('follower'),
    following: t.relation('following'),
  }),
})
