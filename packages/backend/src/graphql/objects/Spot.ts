import { builder } from '../builder'

export const SpotRef = builder.prismaObject('Spot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
  //  createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})