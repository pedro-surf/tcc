import { builder } from '../builder'
import MarketplaceProductTypeEnum from '../enums/MarketplaceProductType'

export const UserGearRef = builder.prismaObject('UserGear', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    productId: t.exposeString('productId'),
    productType: t.expose('productType', { type: MarketplaceProductTypeEnum }),
    acquiredAt: t.expose('acquiredAt', { type: 'DateTime' }),
    releasedAt: t.expose('releasedAt', { type: 'DateTime', nullable: true }),
    fromUserId: t.exposeString('fromUserId', { nullable: true }),
    offerId: t.exposeString('offerId', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    fromUser: t.relation('fromUser', { nullable: true }),
    offer: t.relation('offer', { nullable: true }),
    isCurrent: t.boolean({
      resolve: (row) => row.releasedAt == null,
    }),
  }),
})
