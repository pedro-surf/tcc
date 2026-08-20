import { builder } from '../builder';
import ForecastSourceEnum from '../enums/ForecastSource'

export const SpotForecastRef = builder.prismaObject('SpotForecast', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId', { nullable: true }),
    ideal: t.exposeBoolean('ideal'),
    score: t.exposeFloat('score', { nullable: true }),
    userId: t.exposeString('userId'),
    swell: t.exposeFloat('swell'),
    swellDir: t.exposeFloat('swellDir'),
    wind: t.exposeFloat('wind'),
    windDir: t.exposeFloat('windDir'),
    period: t.exposeFloat('period', { nullable: true }),
    energy: t.exposeFloat('energy', { nullable: true }),
    temp: t.exposeFloat('temp', { nullable: true }),
    gust: t.exposeString('gust', { nullable: true }),
    power: t.exposeString('power', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    source: t.expose('source', { type: ForecastSourceEnum, nullable: true }),
    fetchId: t.exposeString('fetchId', { nullable: true }),
    conditionVec: t.field({
      type: ['Float'],
      nullable: true,
      resolve: (row) => (row.conditionVec?.length ? row.conditionVec : null),
    }),
    spot: t.relation('spot', { nullable: true }),
    user: t.relation('user'),
    location: t.relation('location', { nullable: true }),
    fetch: t.relation('fetch', { nullable: true }),
    weeklyDescriptions: t.relation('weeklyDescriptions'),
  }),
});