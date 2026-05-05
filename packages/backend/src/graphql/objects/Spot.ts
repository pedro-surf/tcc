import { builder } from '../builder'
import BottomTypeEnum from '../enums/BottomType';
import WaveTypeEnum from '../enums/WaveType';

export const SpotRef = builder.prismaObject('Spot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    waveType: t.expose('waveType', { type: WaveTypeEnum }),
    bottomType: t.expose('bottomType', { type: BottomTypeEnum }),
    locationId: t.exposeString('locationId'),
    secret: t.exposeBoolean('secret'),
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
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
    data: t.relation('data'),
  }),
});