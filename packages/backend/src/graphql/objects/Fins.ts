import { builder } from '../builder'

export const FinsRef = builder.prismaObject('Fins', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brand: t.exposeString('brand', { nullable: true }),
    size: t.exposeString('size', { nullable: true }),
    ownerId: t.exposeString('ownerId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    owner: t.relation('owner', { nullable: true }),
  }),
})
