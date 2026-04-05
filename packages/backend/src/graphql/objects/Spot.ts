import { builder } from '../builder'

builder.prismaObject('Spot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
  //  createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})