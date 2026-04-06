import { builder } from '../builder'

export const SpotCheckRef = builder.prismaObject('SpotCheck', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    userId: t.exposeString('userId'),
    conditions: t.exposeString('conditions'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
    user: t.relation('user'),
    media: t.relation('media'),
  }),
});