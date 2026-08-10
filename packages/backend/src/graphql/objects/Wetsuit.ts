import { builder } from '../builder'

export const WetsuitRef = builder.prismaObject('Wetsuit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brandId: t.exposeString('brandId', { nullable: true }),
    size: t.exposeString('size', { nullable: true }),
    thickness: t.exposeFloat('thickness'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    brand: t.relation('brand', { nullable: true }),
    sessions: t.relation('sessions'),
  }),
})
