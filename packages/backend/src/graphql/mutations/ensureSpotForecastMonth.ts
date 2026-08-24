import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SpotForecastMonthRef } from '../objects/SpotForecastMonth'
import { canViewSpot } from '../utils/spotVisibility'
import {
  ForecastLambdaError,
  invokeIngestSpotMonth,
} from '../../jobs/invokeForecastLambda'

builder.mutationField('ensureSpotForecastMonth', (t) =>
  t.field({
    type: SpotForecastMonthRef,
    args: {
      spotId: t.arg.id({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const access = await prisma.spot.findUnique({
        where: { id: String(args.spotId) },
        select: { id: true, secret: true, createdById: true },
      })
      if (!access || !(await canViewSpot(access, ctx))) {
        throw new GraphQLError('Spot not found')
      }

      try {
        return await invokeIngestSpotMonth({
          spotId: access.id,
          year: args.year,
          month: args.month,
          requestedById: user.id,
        })
      } catch (error) {
        if (error instanceof ForecastLambdaError) {
          throw new GraphQLError(error.message)
        }
        throw new GraphQLError(
          error instanceof Error
            ? error.message
            : 'Failed to load forecast month',
        )
      }
    },
  }),
)
