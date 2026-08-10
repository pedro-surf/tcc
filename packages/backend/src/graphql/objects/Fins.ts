import { builder } from '../builder'

export const FinsRef = builder.prismaObject('Fins', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brandId: t.exposeString('brandId', { nullable: true }),
    size: t.exposeString('size', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    brand: t.relation('brand', { nullable: true }),
  }),
})
