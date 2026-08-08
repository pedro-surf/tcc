import { builder } from '../builder'

export const UserRef = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    followers: t.relation('followers'),
    following: t.relation('following'),
  }),
})
