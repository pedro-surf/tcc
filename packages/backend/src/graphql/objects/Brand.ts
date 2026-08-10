import { builder } from '../builder'

export const BrandRef = builder.prismaObject('Brand', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    boards: t.relation('boards'),
    wetsuits: t.relation('wetsuits'),
    fins: t.relation('fins'),
    leashes: t.relation('leashes'),
  }),
})
