import { builder } from '../builder'
import ForecastFetchKindEnum from '../enums/ForecastFetchKind'
import ForecastSourceEnum from '../enums/ForecastSource'

export const SpotForecastFetchRef = builder.prismaObject('SpotForecastFetch', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    source: t.expose('source', { type: ForecastSourceEnum }),
    kind: t.expose('kind', { type: ForecastFetchKindEnum }),
    year: t.exposeInt('year'),
    month: t.exposeInt('month'),
    from: t.expose('from', { type: 'DateTime' }),
    to: t.expose('to', { type: 'DateTime' }),
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
    datasetId: t.exposeString('datasetId', { nullable: true }),
    rawPayload: t.expose('rawPayload', { type: 'Json' }),
    requestedById: t.exposeString('requestedById', { nullable: true }),
    fetchedAt: t.expose('fetchedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
    requestedBy: t.relation('requestedBy', { nullable: true }),
    forecasts: t.relation('forecasts'),
  }),
})
