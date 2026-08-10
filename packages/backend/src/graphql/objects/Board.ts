import { builder } from '../builder'

export const BoardRef = builder.prismaObject('Board', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    brand: t.exposeString('brand', { nullable: true }),
    length: t.exposeFloat('length'),
    width: t.exposeFloat('width'),
    thickness: t.exposeFloat('thickness'),
    volume: t.exposeFloat('volume', { nullable: true }),
    ownerId: t.exposeString('ownerId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    owner: t.relation('owner', { nullable: true }),
    sessions: t.relation('sessions'),
  }),
})
