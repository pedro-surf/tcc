import { builder } from "../builder";

export const SpotCompetitionRef = builder.prismaObject('SpotCompetition', {
    fields: (t) => ({
      id: t.exposeID('id'),
      spotId: t.exposeString('spotId'),
      name: t.exposeString('name'),
      date: t.expose('date', { type: 'DateTime' }),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      spot: t.relation('spot'),
    }),
  });