import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SpotRef } from '../objects/Spot'
import { canViewSpot } from '../utils/spotVisibility'
import {
  ForecastLambdaError,
  invokeWeeklyDescription,
} from '../../jobs/invokeForecastLambda'

builder.mutationField('generateSpotWeeklyDescription', (t) =>
  t.prismaField({
    type: SpotRef,
    args: {
      spotId: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)

      const access = await prisma.spot.findUnique({
        where: { id: String(args.spotId) },
        select: { id: true, secret: true, createdById: true },
      })
      if (!access || !(await canViewSpot(access, ctx))) {
        throw new GraphQLError('Spot not found')
      }

      try {
        const updated = await invokeWeeklyDescription({ spotId: access.id })
        return prisma.spot.findUniqueOrThrow({
          ...query,
          where: { id: updated.id },
        })
      } catch (error) {
        if (error instanceof ForecastLambdaError && error.status === 429) {
          const payload = error.payload as { nextAvailableAt?: string } | undefined
          throw new GraphQLError(error.message, {
            extensions: {
              code: 'WEEKLY_DESCRIPTION_COOLDOWN',
              nextAvailableAt: payload?.nextAvailableAt ?? null,
            },
          })
        }
        throw new GraphQLError(
          error instanceof Error
            ? error.message
            : 'Failed to generate weekly description',
        )
      }
    },
  }),
)
