import { builder } from '../builder'

  
export const SpotAccessRef = builder.prismaObject('SpotAccess', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    userId: t.exposeString('userId'),
    accessType: t.exposeString('accessType'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
    user: t.relation('user'),
  }),
});
