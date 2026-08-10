import { GraphQLError } from 'graphql'
import {
  Currency,
  MarketplaceProductType,
} from '@prisma/client'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { OfferRef } from '../objects/Offer'
import { UserRef } from '../objects/User'
import MarketplaceProductTypeEnum from '../enums/MarketplaceProductType'
import CurrencyEnum from '../enums/Currency'

const CreateMarketplaceListingInput = builder.inputType(
  'CreateMarketplaceListingInput',
  {
    fields: (t) => ({
      productType: t.field({
        type: MarketplaceProductTypeEnum,
        required: true,
      }),
      name: t.string({ required: true }),
      brand: t.string(),
      description: t.string(),
      price: t.float({ required: true }),
      currency: t.field({ type: CurrencyEnum }),
      // board
      length: t.float(),
      width: t.float(),
      thickness: t.float(),
      volume: t.float(),
      // wetsuit / fins
      size: t.string(),
    }),
  },
)

builder.mutationField('updateMyProfile', (t) =>
  t.prismaField({
    type: UserRef,
    args: {
      location: t.arg.string(),
      phone: t.arg.string(),
      bio: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      return prisma.user.update({
        ...query,
        where: { id: user.id },
        data: {
          location:
            args.location === undefined
              ? undefined
              : args.location.trim() || null,
          phone:
            args.phone === undefined ? undefined : args.phone.trim() || null,
          bio: args.bio === undefined ? undefined : args.bio.trim() || null,
        },
      })
    },
  }),
)

builder.mutationField('createMarketplaceListing', (t) =>
  t.prismaField({
    type: OfferRef,
    args: {
      data: t.arg({ type: CreateMarketplaceListingInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const name = args.data.name.trim()
      if (!name) throw new GraphQLError('Name is required')
      if (args.data.price <= 0) {
        throw new GraphQLError('Price must be greater than 0')
      }

      const productType = args.data.productType as MarketplaceProductType
      const brand = args.data.brand?.trim() || null
      const currency = (args.data.currency as Currency | null) ?? Currency.BRL

      return prisma.$transaction(async (tx) => {
        let productId: string
        let title = [brand, name].filter(Boolean).join(' ')

        switch (productType) {
          case MarketplaceProductType.BOARD: {
            if (
              args.data.length == null ||
              args.data.width == null ||
              args.data.thickness == null
            ) {
              throw new GraphQLError(
                'Board listings need length, width, and thickness',
              )
            }
            const board = await tx.board.create({
              data: {
                name,
                brand,
                length: args.data.length,
                width: args.data.width,
                thickness: args.data.thickness,
                volume: args.data.volume ?? null,
                ownerId: user.id,
              },
            })
            productId = board.id
            break
          }
          case MarketplaceProductType.WETSUIT: {
            if (args.data.thickness == null) {
              throw new GraphQLError('Wetsuit listings need thickness')
            }
            const suit = await tx.wetsuit.create({
              data: {
                name,
                brand,
                size: args.data.size?.trim() || null,
                thickness: args.data.thickness,
                ownerId: user.id,
              },
            })
            productId = suit.id
            break
          }
          case MarketplaceProductType.FINS: {
            const fins = await tx.fins.create({
              data: {
                name,
                brand,
                size: args.data.size?.trim() || null,
                ownerId: user.id,
              },
            })
            productId = fins.id
            break
          }
          case MarketplaceProductType.LEASH: {
            const leash = await tx.leash.create({
              data: {
                name,
                brand,
                length: args.data.length ?? null,
                thickness: args.data.thickness ?? null,
                ownerId: user.id,
              },
            })
            productId = leash.id
            break
          }
          default:
            throw new GraphQLError('Unsupported product type')
        }

        return tx.offer.create({
          ...query,
          data: {
            userId: user.id,
            productId,
            productType,
            price: args.data.price,
            currency,
            title,
            description: args.data.description?.trim() || null,
            active: true,
          },
        })
      })
    },
  }),
)

builder.queryField('offers', (t) =>
  t.prismaField({
    type: [OfferRef],
    args: {
      take: t.arg.int(),
      skip: t.arg.int(),
      productType: t.arg({ type: MarketplaceProductTypeEnum }),
    },
    resolve: async (query, _root, args) =>
      prisma.offer.findMany({
        ...query,
        where: {
          active: true,
          ...(args.productType
            ? { productType: args.productType as MarketplaceProductType }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: args.take ?? 50,
        skip: args.skip ?? 0,
      }),
  }),
)
