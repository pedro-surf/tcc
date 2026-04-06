import { builder } from '../builder'

export const ManueverEventRef =
  builder.prismaObject('ManeuverEvent', {
    fields: (t) => ({
      id: t.exposeID('id'),
      timestamp: t.exposeFloat('timestamp'),
      type: t.exposeString('type'),
      score: t.exposeFloat('score'),
      sessionId: t.exposeString('sessionId'),
      session: t.relation('session'),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
    }),
  });