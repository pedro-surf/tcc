import { prisma } from '../builder'
import type { Context } from '../context'

/** User ids in a follow relationship with `userId` (either direction). */
export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.follower.findMany({
    where: {
      OR: [{ followerId: userId }, { followingId: userId }],
    },
    select: { followerId: true, followingId: true },
  })
  const ids = new Set<string>()
  for (const row of rows) {
    if (row.followerId !== userId) ids.add(row.followerId)
    if (row.followingId !== userId) ids.add(row.followingId)
  }
  return [...ids]
}

/** Prisma `where` fragment: public spots + secret spots shared with the viewer. */
export async function spotVisibilityWhere(ctx: Context) {
  const publicOrUnset = { secret: { not: true } as const }

  if (!ctx.user) {
    return publicOrUnset
  }

  const friendIds = await getFriendIds(ctx.user.id)
  return {
    OR: [
      publicOrUnset,
      { createdById: ctx.user.id },
      ...(friendIds.length > 0
        ? [{ createdById: { in: friendIds } }]
        : []),
    ],
  }
}

export async function canViewSpot(
  spot: { secret: boolean | null; createdById: string | null },
  ctx: Context,
): Promise<boolean> {
  if (!spot.secret) return true
  if (!ctx.user || !spot.createdById) return false
  if (spot.createdById === ctx.user.id) return true

  const friendship = await prisma.follower.findFirst({
    where: {
      OR: [
        { followerId: ctx.user.id, followingId: spot.createdById },
        { followerId: spot.createdById, followingId: ctx.user.id },
      ],
    },
    select: { id: true },
  })
  return Boolean(friendship)
}
