import { builder } from '../builder'

export const SessionRatingRef = builder.prismaObject('SessionRating', {
  fields: (t) => ({
    id: t.exposeID('id'),
    sessionId: t.exposeString('sessionId'),
    rating: t.exposeInt('rating'),
    comments: t.exposeString('comments', { nullable: true }),
    creatorId: t.exposeString('creatorId'),
    surfed: t.exposeBoolean('surfed'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    session: t.relation('session'),
    creator: t.relation('creator'),
  }),
});