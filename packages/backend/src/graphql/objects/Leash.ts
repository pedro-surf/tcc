import { builder } from '../builder'

export const LeashRef = builder.prismaObject('Leash', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brandId: t.exposeString('brandId', { nullable: true }),
    length: t.exposeFloat('length', { nullable: true }),
    thickness: t.exposeFloat('thickness', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    brand: t.relation('brand', { nullable: true }),
  }),
})
