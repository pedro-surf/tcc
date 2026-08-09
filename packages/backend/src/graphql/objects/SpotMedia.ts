import { builder } from '../builder'
import MediaTypeEnum from '../enums/MediaType'

export const SpotMediaRef = builder.prismaObject('SpotMedia', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotId: t.exposeString('spotId'),
    mediaUrl: t.exposeString('mediaUrl'),
    mediaType: t.expose('mediaType', { type: MediaTypeEnum }),
    mimeType: t.exposeString('mimeType', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spot: t.relation('spot'),
  }),
})
