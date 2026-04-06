import { builder } from '../builder'

export const SpotCheckMediaRef = builder.prismaObject('SpotCheckMedia', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotCheckId: t.exposeString('spotCheckId'),
    mediaUrl: t.exposeString('mediaUrl'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spotCheck: t.relation('spotCheck'),
  }),
});