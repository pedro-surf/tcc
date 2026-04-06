import { builder } from '../builder'

export const LikeRef = builder.prismaObject('Like', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    sessionId: t.exposeString('sessionId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    session: t.relation('session'),
  }),
});