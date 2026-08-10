import { Router } from 'express'
import { verifyAuthToken } from '../auth/jwt'
import { prisma } from '../graphql/builder'
import {
  WeeklyDescriptionCooldownError,
  canGenerateWeeklyDescription,
  generateAndStoreWeeklySpotDescription,
} from '../ai/weeklySpotDescription'
import { canViewSpot } from '../graphql/utils/spotVisibility'
import type { Context } from '../graphql/context'

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
          weeklyGeneratedAt: true,
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

      const cooldown = canGenerateWeeklyDescription(access.weeklyGeneratedAt)
      if (!cooldown.allowed) {
        res.status(429).json({
          error: 'Weekly AI description can only be generated once per week',
          nextAvailableAt: cooldown.nextAvailableAt?.toISOString() ?? null,
        })
        return
      }

      const spot = await generateAndStoreWeeklySpotDescription(spotId)
      res.status(201).json({
        id: spot.id,
        weeklyGeneratedDescription: spot.weeklyGeneratedDescription,
        weeklyGeneratedAt: spot.weeklyGeneratedAt?.toISOString() ?? null,
      })
    } catch (error) {
      if (error instanceof WeeklyDescriptionCooldownError) {
        res.status(429).json({
          error: error.message,
          nextAvailableAt: error.nextAvailableAt.toISOString(),
        })
        return
      }
      const message =
        error instanceof Error ? error.message : 'Failed to generate description'
      const status = message.includes('OPENAI_API_KEY') ? 503 : 400
      res.status(status).json({ error: message })
    }
  },
)
