import { GraphQLError } from 'graphql'
import { MediaType } from '@prisma/client'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SpotCheckRef } from '../objects/SpotCheck'
import MediaTypeEnum from '../enums/MediaType'

const SpotCheckMediaInput = builder.inputType('SpotCheckMediaInput', {
  fields: (t) => ({
    mediaUrl: t.string({ required: true }),
    mediaType: t.field({ type: MediaTypeEnum, required: true }),
    mimeType: t.string(),
  }),
})

const SpotCheckCreateInput = builder.inputType('SpotCheckCreateInput', {
  fields: (t) => ({
    spotId: t.string({ required: true }),
    description: t.string({ required: true }),
    score: t.float({ required: true }),
    timestamp: t.field({ type: 'DateTime' }),
    media: t.field({ type: [SpotCheckMediaInput] }),
  }),
})

builder.mutationField('createSpotCheck', (t) =>
  t.prismaField({
    type: SpotCheckRef,
    args: {
      data: t.arg({ type: SpotCheckCreateInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const description = args.data.description.trim()
      const score = args.data.score
      const media = args.data.media ?? []

      if (!description) {
        throw new GraphQLError('Description is required')
      }
      if (score < 0 || score > 10) {
        throw new GraphQLError('Score must be between 0 and 10')
      }
      if (media.length === 0) {
        throw new GraphQLError('Add at least one picture or video')
      }

      const spot = await prisma.spot.findUnique({
        where: { id: args.data.spotId },
        select: { id: true },
      })
      if (!spot) {
        throw new GraphQLError('Spot not found')
      }

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

      return prisma.spotCheck.create({
        ...query,
        data: {
          spotId: args.data.spotId,
          userId: user.id,
          description,
          score,
          timestamp: args.data.timestamp
            ? new Date(args.data.timestamp)
            : undefined,
          media: {
            create: media.map((item) => ({
              mediaUrl: item.mediaUrl.trim(),
              mediaType: item.mediaType as MediaType,
              mimeType: item.mimeType?.trim() || null,
            })),
          },
        },
      })
    },
  }),
)
