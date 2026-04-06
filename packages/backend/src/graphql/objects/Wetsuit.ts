import { builder } from '../builder'

export const WetsuitRef = builder.prismaObject('Wetsuit', {
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      thickness: t.exposeFloat('thickness'),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      sessions: t.relation('sessions'),
    }),
  });