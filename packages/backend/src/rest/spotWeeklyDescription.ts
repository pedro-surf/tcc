import { Router } from 'express'
import { verifyAuthToken } from '../auth/jwt'
import { prisma } from '../graphql/builder'
import { canViewSpot } from '../graphql/utils/spotVisibility'
import type { Context } from '../graphql/context'
import {
  ForecastLambdaError,
  invokeWeeklyDescription,
} from '../jobs/invokeForecastLambda'

export const spotWeeklyDescriptionRouter = Router()

async function requireAuthUser(req: {
  headers: { authorization?: string }
}) {
  const header = req.headers.authorization
  const [scheme, token] = header?.split(' ') ?? []
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }
  const payload = verifyAuthToken(token)
  if (!payload) return null
  return prisma.user.findUnique({ where: { id: payload.sub } })
}

spotWeeklyDescriptionRouter.post(
  '/:spotId/weekly-description',
  async (req, res) => {
    try {
      const user = await requireAuthUser(req)
      if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const spotId = String(req.params.spotId)
      const access = await prisma.spot.findUnique({
        where: { id: spotId },
        select: {
          id: true,
          secret: true,
          createdById: true,
        },
      })
      if (!access) {
        res.status(404).json({ error: 'Spot not found' })
        return
      }

      const ctx = { user, ip: '', req: req as any } as Context
      if (!(await canViewSpot(access, ctx))) {
        res.status(404).json({ error: 'Spot not found' })
        return
      }

      const spot = await invokeWeeklyDescription({ spotId })
      res.status(201).json({
        id: spot.id,
        weeklyGeneratedDescription: spot.weeklyGeneratedDescription,
        weeklyGeneratedAt: spot.weeklyGeneratedAt?.toISOString() ?? null,
      })
    } catch (error) {
      if (error instanceof ForecastLambdaError && error.status === 429) {
        const payload = error.payload as { nextAvailableAt?: string } | undefined
        res.status(429).json({
          error: error.message,
          nextAvailableAt: payload?.nextAvailableAt ?? null,
        })
        return
      }
      const message =
        error instanceof Error ? error.message : 'Failed to generate description'
      const status =
        error instanceof ForecastLambdaError
          ? error.status
          : message.includes('OPENAI_API_KEY') || message.includes('not reachable')
            ? 503
            : 400
      res.status(status).json({ error: message })
    }
  },
)
