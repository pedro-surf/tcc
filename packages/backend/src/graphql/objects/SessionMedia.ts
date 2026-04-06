import { builder } from '../builder'

export const SessionMediaRef =
  builder.prismaObject('SessionMedia', {
    fields: (t) => ({
      id: t.exposeID('id'),
      sessionId: t.exposeString('sessionId'),
      mediaUrl: t.exposeString('mediaUrl'),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      session: t.relation('session'),
    }),
  });