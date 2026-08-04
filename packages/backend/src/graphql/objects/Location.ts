import { builder } from '../builder'
import CountryEnum from '../enums/Country';

export const LocationRef = builder.prismaObject('Location', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    country: t.expose('country', { type: CountryEnum }),
    lat: t.exposeFloat('lat', { nullable: true }),
    lng: t.exposeFloat('lng', { nullable: true }),
    mapsUrl: t.string({
      nullable: true,
      resolve: (d) => {
        if (d.lat == null || d.lng == null) return null
        return `https://www.google.com/maps?q=${d.lat},${d.lng}`
      },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spots: t.relation('spots'),
  }),
});