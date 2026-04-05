import { builder } from '../builder'

builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),    
    // createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})
