import { GraphQLError } from 'graphql'
import { MediaType } from '@prisma/client'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import MediaTypeEnum from '../enums/MediaType'
import BottomTypeEnum from '../enums/BottomType'
import CountryEnum from '../enums/Country'
import WaveTypeEnum from '../enums/WaveType'
import { SpotRef } from '../objects/Spot'

const SpotMediaInput = builder.inputType('SpotMediaInput', {
  fields: (t) => ({
    mediaUrl: t.string({ required: true }),
    mediaType: t.field({ type: MediaTypeEnum, required: true }),
    mimeType: t.string(),
  }),
})

const SpotCreateInput = builder.inputType('SpotCreateInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    difficulty: t.string(),
    description: t.string(),
    locationId: t.string({ required: true }),
    waveType: t.field({ type: WaveTypeEnum, required: true }),
    bottomType: t.field({ type: BottomTypeEnum, required: true }),
    country: t.field({ type: CountryEnum, required: true }),
    lat: t.float({ required: true }),
    lng: t.float({ required: true }),
    idealWindDir: t.float(),
    idealSwellDir: t.float(),
    strongSwellTolerance: t.int(),
    strongWindTolerance: t.int(),
    secret: t.boolean(),
    media: t.field({ type: [SpotMediaInput] }),
  }),
})

function clampTolerance(value: number | null | undefined, label: string) {
  if (value == null) return null
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new GraphQLError(`${label} must be an integer from 1 to 5`)
  }
  return value
}

builder.mutationField('createSpot', (t) =>
  t.prismaField({
    type: SpotRef,
    args: {
      data: t.arg({ type: SpotCreateInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const name = args.data.name.trim()
      if (!name) throw new GraphQLError('Name is required')

      const media = args.data.media ?? []
      for (const item of media) {
        if (!item.mediaUrl.trim()) {
          throw new GraphQLError('Each media item needs a URL')
        }
        if (
          item.mediaType !== MediaType.IMAGE &&
          item.mediaType !== MediaType.VIDEO
        ) {
          throw new GraphQLError('mediaType must be IMAGE or VIDEO')
        }
      }

      const location = await prisma.location.findUnique({
        where: { id: args.data.locationId },
        select: { id: true },
      })
      if (!location) throw new GraphQLError('Location not found')

      return prisma.spot.create({
        ...query,
        data: {
          name,
          difficulty: args.data.difficulty?.trim() || null,
          description: args.data.description?.trim() || null,
          locationId: args.data.locationId,
          waveType: args.data.waveType,
          bottomType: args.data.bottomType,
          country: args.data.country,
          lat: args.data.lat,
          lng: args.data.lng,
          idealWindDir: args.data.idealWindDir ?? null,
          idealSwellDir: args.data.idealSwellDir ?? null,
          strongSwellTolerance: clampTolerance(
            args.data.strongSwellTolerance,
            'strongSwellTolerance',
          ),
          strongWindTolerance: clampTolerance(
            args.data.strongWindTolerance,
            'strongWindTolerance',
          ),
          secret: Boolean(args.data.secret),
          createdById: user.id,
          media:
            media.length > 0
              ? {
                  create: media.map((item) => ({
                    mediaUrl: item.mediaUrl.trim(),
                    mediaType: item.mediaType as MediaType,
                    mimeType: item.mimeType?.trim() || null,
                  })),
                }
              : undefined,
        },
      })
    },
  }),
)
