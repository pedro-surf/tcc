import { builder } from '../builder'

export const LeashRef = builder.prismaObject('Leash', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brand: t.exposeString('brand', { nullable: true }),
    length: t.exposeFloat('length', { nullable: true }),
    thickness: t.exposeFloat('thickness', { nullable: true }),
    ownerId: t.exposeString('ownerId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    owner: t.relation('owner', { nullable: true }),
  }),
})
