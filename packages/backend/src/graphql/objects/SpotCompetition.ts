import { builder } from '../builder'

export const SpotCompetitionRef = builder.prismaObject('SpotCompetition', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    date: t.expose('date', { type: 'DateTime' }),
    createdById: t.exposeString('createdById', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
    createdBy: t.relation('createdBy', { nullable: true }),
  }),
})
