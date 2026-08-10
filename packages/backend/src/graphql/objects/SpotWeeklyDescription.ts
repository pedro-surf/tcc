import { builder } from '../builder'

export const SpotWeeklyDescriptionRef = builder.prismaObject(
  'SpotWeeklyDescription',
  {
    fields: (t) => ({
      id: t.exposeID('id'),
      spotId: t.exposeString('spotId'),
      description: t.exposeString('description'),
      generatedAt: t.expose('generatedAt', { type: 'DateTime' }),
      weekStart: t.expose('weekStart', { type: 'DateTime' }),
      primaryForecastId: t.exposeString('primaryForecastId', { nullable: true }),
      spot: t.relation('spot'),
      primaryForecast: t.relation('primaryForecast', { nullable: true }),
    }),
  },
)
