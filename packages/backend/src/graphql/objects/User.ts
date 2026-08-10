import { builder } from '../builder'

export const UserRef = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    location: t.exposeString('location', { nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    followers: t.relation('followers'),
    following: t.relation('following'),
    gearOwnerships: t.relation('gearOwnerships'),
    offers: t.relation('offers'),
    purchases: t.relation('purchases'),
  }),
})
