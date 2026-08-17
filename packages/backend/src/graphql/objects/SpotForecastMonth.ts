import { builder, prisma } from '../builder'
import ForecastFetchKindEnum from '../enums/ForecastFetchKind'
import ForecastSourceEnum from '../enums/ForecastSource'
import { SpotForecastRef } from './SpotForecast'
import type { ForecastFetchKind, ForecastSource } from '@prisma/client'

export type SpotForecastMonthParent = {
  spotId: string
  year: number
  month: number
  kind: ForecastFetchKind
  source: ForecastSource
  fromCache: boolean
  from: Date
  to: Date
  fetchId: string
}

export const SpotForecastMonthRef = builder
  .objectRef<SpotForecastMonthParent>('SpotForecastMonth')
  .implement({
    fields: (t) => ({
      spotId: t.exposeString('spotId'),
      year: t.exposeInt('year'),
      month: t.exposeInt('month'),
      kind: t.expose('kind', { type: ForecastFetchKindEnum }),
      source: t.expose('source', { type: ForecastSourceEnum }),
      fromCache: t.exposeBoolean('fromCache'),
      from: t.expose('from', { type: 'DateTime' }),
      to: t.expose('to', { type: 'DateTime' }),
      fetchId: t.exposeID('fetchId'),
      forecasts: t.prismaField({
        type: [SpotForecastRef],
        resolve: async (query, parent) =>
          prisma.spotForecast.findMany({
            ...query,
            where: {
              spotId: parent.spotId,
              timestamp: { gte: parent.from, lt: parent.to },
            },
            orderBy: { timestamp: 'asc' },
          }),
      }),
    }),
  })

export type SpotForecastCalendarMonthParent = {
  year: number
  month: number
  source: ForecastSource
  kind: ForecastFetchKind
  fetchedAt: Date
  rowCount: number
}

export const SpotForecastCalendarMonthRef = builder
  .objectRef<SpotForecastCalendarMonthParent>('SpotForecastCalendarMonth')
  .implement({
    fields: (t) => ({
      year: t.exposeInt('year'),
      month: t.exposeInt('month'),
      source: t.expose('source', { type: ForecastSourceEnum }),
      kind: t.expose('kind', { type: ForecastFetchKindEnum }),
      fetchedAt: t.expose('fetchedAt', { type: 'DateTime' }),
      rowCount: t.exposeInt('rowCount'),
    }),
  })
