import { Prisma } from '@prisma/client';
import { builder } from '../builder'

export const SpotRef = builder.prismaObject('Spot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    location: t.exposeString('location'),
    secret: t.exposeBoolean('secret'),
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
    difficulty: t.exposeString('difficulty', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    sessions: t.relation('sessions'),
    accesses: t.relation('accesses'),
    checks: t.relation('checks'),
    competitions: t.relation('competitions'),
    data: t.relation('data'),
  }),
});