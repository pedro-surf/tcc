import { builder } from '../builder'

  
export const SpotDataRef = builder.prismaObject('SpotData', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    data: t.expose('data', { type: 'Json' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
  }),
});
