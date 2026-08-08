import { builder } from '../builder'
import MediaTypeEnum from '../enums/MediaType'

export const SpotCheckMediaRef = builder.prismaObject('SpotCheckMedia', {
  fields: (t) => ({
    id: t.exposeID('id'),
    spotCheckId: t.exposeString('spotCheckId'),
    mediaUrl: t.exposeString('mediaUrl'),
    mediaType: t.expose('mediaType', { type: MediaTypeEnum }),
    mimeType: t.exposeString('mimeType', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    spotCheck: t.relation('spotCheck'),
  }),
})
