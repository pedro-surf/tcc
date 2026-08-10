import { builder } from '../builder'

export const BoardRef = builder.prismaObject('Board', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brandId: t.exposeString('brandId', { nullable: true }),
    length: t.exposeFloat('length'),
    width: t.exposeFloat('width'),
    thickness: t.exposeFloat('thickness'),
    volume: t.exposeFloat('volume', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    brand: t.relation('brand', { nullable: true }),
    sessions: t.relation('sessions'),
  }),
})
