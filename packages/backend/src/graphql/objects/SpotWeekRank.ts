import { builder, prisma } from '../builder'
import IdealOriginEnum from '../enums/IdealOrigin'
import { SpotRef } from './Spot'
import { SpotForecastRef } from './SpotForecast'
import type { IdealOrigin, SpotWeekRankRow } from '../../forecast/rankSpotsForWeek'

export const SpotWeekRankRef = builder
  .objectRef<SpotWeekRankRow>('SpotWeekRank')
  .implement({
    fields: (t) => ({
      spotId: t.exposeString('spotId'),
      weekScore: t.exposeFloat('weekScore'),
      bestScore: t.exposeFloat('bestScore'),
      bestAt: t.expose('bestAt', { type: 'DateTime' }),
      matchedOrigin: t.expose('matchedOrigin', { type: IdealOriginEnum }),
      idealCount: t.exposeInt('idealCount'),
      forecastCount: t.exposeInt('forecastCount'),
      bestSwell: t.exposeFloat('bestSwell'),
      bestSwellDir: t.exposeFloat('bestSwellDir'),
      bestWind: t.exposeFloat('bestWind'),
      bestWindDir: t.exposeFloat('bestWindDir'),
      spot: t.prismaField({
        type: SpotRef,
        resolve: async (query, parent) =>
          prisma.spot.findUniqueOrThrow({
            ...query,
            where: { id: parent.spotId },
          }),
      }),
      bestForecast: t.prismaField({
        type: SpotForecastRef,
        nullable: true,
        resolve: async (query, parent) => {
          if (!parent.forecastId) return null
          return prisma.spotForecast.findUnique({
            ...query,
            where: { id: parent.forecastId },
          })
        },
      }),
      matchedIdealForecast: t.prismaField({
        type: SpotForecastRef,
        nullable: true,
        resolve: async (query, parent) => {
          if (parent.matchedOrigin !== ('FORECAST' as IdealOrigin)) return null
          if (!parent.idealForecastId) return null
          return prisma.spotForecast.findUnique({
            ...query,
            where: { id: parent.idealForecastId },
          })
        },
      }),
    }),
  })
