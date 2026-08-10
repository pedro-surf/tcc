import { builder, prisma } from '../builder'
import MarketplaceProductTypeEnum from '../enums/MarketplaceProductType'
import CurrencyEnum from '../enums/Currency'
import { MarketplaceProductType } from '@prisma/client'

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
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    productLabel: t.string({
      resolve: async (offer) => {
        if (offer.title?.trim()) return offer.title.trim()
        switch (offer.productType) {
          case MarketplaceProductType.BOARD: {
            const board = await prisma.board.findUnique({
              where: { id: offer.productId },
              select: { name: true, brand: true },
            })
            return board
              ? [board.brand, board.name].filter(Boolean).join(' ')
              : 'Board'
          }
          case MarketplaceProductType.WETSUIT: {
            const suit = await prisma.wetsuit.findUnique({
              where: { id: offer.productId },
              select: { name: true, brand: true },
            })
            return suit
              ? [suit.brand, suit.name].filter(Boolean).join(' ')
              : 'Wetsuit'
          }
          case MarketplaceProductType.FINS: {
            const fins = await prisma.fins.findUnique({
              where: { id: offer.productId },
              select: { name: true, brand: true },
            })
            return fins
              ? [fins.brand, fins.name].filter(Boolean).join(' ')
              : 'Fins'
          }
          case MarketplaceProductType.LEASH: {
            const leash = await prisma.leash.findUnique({
              where: { id: offer.productId },
              select: { name: true, brand: true },
            })
            return leash
              ? [leash.brand, leash.name].filter(Boolean).join(' ')
              : 'Leash'
          }
          default:
            return 'Gear'
        }
      },
    }),
  }),
})
