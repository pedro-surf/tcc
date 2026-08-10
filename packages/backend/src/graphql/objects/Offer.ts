import { MarketplaceProductType } from '@prisma/client'
import { builder, prisma } from '../builder'
import CurrencyEnum from '../enums/Currency'
import MarketplaceProductTypeEnum from '../enums/MarketplaceProductType'
import { UserGearRef } from './UserGear'

async function brandNameFor(
  productType: MarketplaceProductType,
  productId: string,
): Promise<string | null> {
  switch (productType) {
    case MarketplaceProductType.BOARD: {
      const row = await prisma.board.findUnique({
        where: { id: productId },
        select: { name: true, brand: { select: { name: true } } },
      })
      return row ? [row.brand?.name, row.name].filter(Boolean).join(' ') : null
    }
    case MarketplaceProductType.WETSUIT: {
      const row = await prisma.wetsuit.findUnique({
        where: { id: productId },
        select: { name: true, brand: { select: { name: true } } },
      })
      return row ? [row.brand?.name, row.name].filter(Boolean).join(' ') : null
    }
    case MarketplaceProductType.FINS: {
      const row = await prisma.fins.findUnique({
        where: { id: productId },
        select: { name: true, brand: { select: { name: true } } },
      })
      return row ? [row.brand?.name, row.name].filter(Boolean).join(' ') : null
    }
    case MarketplaceProductType.LEASH: {
      const row = await prisma.leash.findUnique({
        where: { id: productId },
        select: { name: true, brand: { select: { name: true } } },
      })
      return row ? [row.brand?.name, row.name].filter(Boolean).join(' ') : null
    }
    default:
      return null
  }
}

export const OfferRef = builder.prismaObject('Offer', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    productId: t.exposeString('productId'),
    productType: t.expose('productType', { type: MarketplaceProductTypeEnum }),
    price: t.exposeFloat('price'),
    currency: t.expose('currency', { type: CurrencyEnum }),
    title: t.exposeString('title', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    active: t.exposeBoolean('active'),
    buyerId: t.exposeString('buyerId', { nullable: true }),
    concludedAt: t.expose('concludedAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    buyer: t.relation('buyer', { nullable: true }),
    ownershipHistory: t.field({
      type: [UserGearRef],
      resolve: (offer) =>
        prisma.userGear.findMany({
          where: {
            productId: offer.productId,
            productType: offer.productType,
          },
          orderBy: { acquiredAt: 'asc' },
        }),
    }),
    productLabel: t.string({
      resolve: async (offer) => {
        if (offer.title?.trim()) return offer.title.trim()
        return (
          (await brandNameFor(offer.productType, offer.productId)) || 'Gear'
        )
      },
    }),
  }),
})
