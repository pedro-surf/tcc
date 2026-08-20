import { WEEKLY_DESCRIPTION_COOLDOWN_MS } from '../../ai/weeklySpotDescription'
import { builder } from '../builder'
import BottomTypeEnum from '../enums/BottomType'
import CountryEnum from '../enums/Country'
import WaveTypeEnum from '../enums/WaveType'

export const SpotRef = builder.prismaObject('Spot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    waveType: t.expose('waveType', { type: WaveTypeEnum }),
    bottomType: t.expose('bottomType', { type: BottomTypeEnum }),
    country: t.expose('country', { type: CountryEnum }),
    locationId: t.exposeString('locationId'),
    description: t.exposeString('description', { nullable: true }),
    secret: t.exposeBoolean('secret'),
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
    idealWindDir: t.exposeFloat('idealWindDir', { nullable: true }),
    idealSwellDir: t.exposeFloat('idealSwellDir', { nullable: true }),
    strongSwellTolerance: t.exposeInt('strongSwellTolerance', {
      nullable: true,
    }),
    strongWindTolerance: t.exposeInt('strongWindTolerance', {
      nullable: true,
    }),
    idealConditionVec: t.field({
      type: ['Float'],
      nullable: true,
      resolve: (spot) =>
        spot.idealConditionVec?.length ? spot.idealConditionVec : null,
    }),
    weeklyGeneratedDescription: t.exposeString('weeklyGeneratedDescription', {
      nullable: true,
    }),
    weeklyGeneratedAt: t.expose('weeklyGeneratedAt', {
      type: 'DateTime',
      nullable: true,
    }),
    canGenerateWeeklyDescription: t.boolean({
      resolve: (spot) => {
        if (!spot.weeklyGeneratedAt) return true
        const elapsed =
          Date.now() - new Date(spot.weeklyGeneratedAt).getTime()
        return elapsed >= WEEKLY_DESCRIPTION_COOLDOWN_MS
      },
    }),
    createdById: t.exposeString('createdById', { nullable: true }),
    mapsUrl: t.string({
      resolve: (spot) => {
        return `https://www.google.com/maps?q=${spot.lat},${spot.lng}`
      },
    }),
    difficulty: t.exposeString('difficulty', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    sessions: t.relation('sessions'),
    accesses: t.relation('accesses'),
    checks: t.relation('checks'),
    competitions: t.relation('competitions'),
    forecasts: t.relation('forecasts'),
    forecastFetches: t.relation('forecastFetches', {
      args: {
        take: t.arg.int(),
        skip: t.arg.int(),
      },
      query: (args) => ({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: args.take ?? 36,
        skip: args.skip ?? 0,
      }),
    }),
    data: t.relation('data'),
    media: t.relation('media'),
    weeklyDescriptions: t.relation('weeklyDescriptions', {
      args: {
        take: t.arg.int(),
        skip: t.arg.int(),
      },
      query: (args) => ({
        orderBy: { generatedAt: 'desc' },
        take: args.take ?? 20,
        skip: args.skip ?? 0,
      }),
    }),
    createdBy: t.relation('createdBy', { nullable: true }),
  }),
})
