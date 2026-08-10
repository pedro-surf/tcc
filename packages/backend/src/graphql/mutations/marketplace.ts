import { GraphQLError } from 'graphql'
import {
  Currency,
  MarketplaceProductType,
  type Prisma,
} from '@prisma/client'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { BrandRef } from '../objects/Brand'
import { OfferRef } from '../objects/Offer'
import { UserGearRef } from '../objects/UserGear'
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
      brandId: t.string(),
      brandName: t.string(),
      description: t.string(),
      price: t.float({ required: true }),
      currency: t.field({ type: CurrencyEnum }),
      length: t.float(),
      width: t.float(),
      thickness: t.float(),
      volume: t.float(),
      size: t.string(),
    }),
  },
)

async function resolveBrandId(
  tx: Prisma.TransactionClient,
  brandId?: string | null,
  brandName?: string | null,
): Promise<string | null> {
  if (brandId?.trim()) {
    const existing = await tx.brand.findUnique({
      where: { id: brandId.trim() },
      select: { id: true },
    })
    if (!existing) throw new GraphQLError('Brand not found')
    return existing.id
  }

  const name = brandName?.trim()
  if (!name) return null

  const upserted = await tx.brand.upsert({
    where: { name },
    create: { name },
    update: {},
    select: { id: true, name: true },
  })
  return upserted.id
}

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

builder.mutationField('createBrand', (t) =>
  t.prismaField({
    type: BrandRef,
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      const name = args.name.trim()
      if (!name) throw new GraphQLError('Brand name is required')
      return prisma.brand.upsert({
        ...query,
        where: { name },
        create: { name },
        update: {},
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
      const currency = (args.data.currency as Currency | null) ?? Currency.BRL

      return prisma.$transaction(async (tx) => {
        const brandId = await resolveBrandId(
          tx,
          args.data.brandId,
          args.data.brandName,
        )
        const brand = brandId
          ? await tx.brand.findUnique({
              where: { id: brandId },
              select: { name: true },
            })
          : null
        const title = [brand?.name, name].filter(Boolean).join(' ')

        let productId: string
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
                brandId,
                length: args.data.length,
                width: args.data.width,
                thickness: args.data.thickness,
                volume: args.data.volume ?? null,
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
                brandId,
                size: args.data.size?.trim() || null,
                thickness: args.data.thickness,
              },
            })
            productId = suit.id
            break
          }
          case MarketplaceProductType.FINS: {
            const fins = await tx.fins.create({
              data: {
                name,
                brandId,
                size: args.data.size?.trim() || null,
              },
            })
            productId = fins.id
            break
          }
          case MarketplaceProductType.LEASH: {
            const leash = await tx.leash.create({
              data: {
                name,
                brandId,
                length: args.data.length ?? null,
                thickness: args.data.thickness ?? null,
              },
            })
            productId = leash.id
            break
          }
          default:
            throw new GraphQLError('Unsupported product type')
        }

        const acquiredAt = new Date()
        await tx.userGear.create({
          data: {
            userId: user.id,
            productId,
            productType,
            acquiredAt,
            releasedAt: null,
          },
        })

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

builder.mutationField('concludeOffer', (t) =>
  t.prismaField({
    type: OfferRef,
    args: {
      offerId: t.arg.id({ required: true }),
      buyerEmail: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const seller = requireUser(ctx)
      const email = args.buyerEmail.trim().toLowerCase()
      if (!email) throw new GraphQLError('Buyer email is required')

      const buyer = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      if (!buyer) throw new GraphQLError('Buyer user not found')
      if (buyer.id === seller.id) {
        throw new GraphQLError('Buyer must be a different user')
      }

      return prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUnique({
          where: { id: String(args.offerId) },
        })
        if (!offer) throw new GraphQLError('Offer not found')
        if (offer.userId !== seller.id) {
          throw new GraphQLError('Only the seller can conclude this offer')
        }
        if (!offer.active || offer.concludedAt) {
          throw new GraphQLError('Offer is already concluded')
        }

        const concludedAt = new Date()
        const current = await tx.userGear.findFirst({
          where: {
            productId: offer.productId,
            productType: offer.productType,
            releasedAt: null,
          },
          orderBy: { acquiredAt: 'desc' },
        })

        if (current) {
          if (current.userId !== seller.id) {
            throw new GraphQLError(
              'Seller is not the current recorded owner of this gear',
            )
          }
          await tx.userGear.update({
            where: { id: current.id },
            data: { releasedAt: concludedAt },
          })
        }

        await tx.userGear.create({
          data: {
            userId: buyer.id,
            productId: offer.productId,
            productType: offer.productType,
            acquiredAt: concludedAt,
            releasedAt: null,
            fromUserId: seller.id,
            offerId: offer.id,
          },
        })

        return tx.offer.update({
          ...query,
          where: { id: offer.id },
          data: {
            active: false,
            buyerId: buyer.id,
            concludedAt,
          },
        })
      })
    },
  }),
)

builder.queryField('brands', (t) =>
  t.prismaField({
    type: [BrandRef],
    args: {
      take: t.arg.int(),
      skip: t.arg.int(),
      name: t.arg.string(),
    },
    resolve: async (query, _root, args) => {
      const name = args.name?.trim()
      return prisma.brand.findMany({
        ...query,
        where: name
          ? { name: { contains: name, mode: 'insensitive' } }
          : undefined,
        orderBy: { name: 'asc' },
        take: args.take ?? 100,
        skip: args.skip ?? 0,
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
      includeConcluded: t.arg.boolean(),
    },
    resolve: async (query, _root, args) =>
      prisma.offer.findMany({
        ...query,
        where: {
          ...(args.includeConcluded ? {} : { active: true }),
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

builder.queryField('gearOwnershipHistory', (t) =>
  t.prismaField({
    type: [UserGearRef],
    args: {
      productId: t.arg.string({ required: true }),
      productType: t.arg({
        type: MarketplaceProductTypeEnum,
        required: true,
      }),
    },
    resolve: async (query, _root, args) =>
      prisma.userGear.findMany({
        ...query,
        where: {
          productId: args.productId,
          productType: args.productType as MarketplaceProductType,
        },
        orderBy: { acquiredAt: 'asc' },
      }),
  }),
)
