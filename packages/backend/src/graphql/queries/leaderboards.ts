import { builder, prisma } from '../builder'
import { UserRef } from '../objects/User'

type RankRow = {
  userId: string
  score: number
  rank: number
}

const LeaderboardEntryRef = builder
  .objectRef<RankRow>('LeaderboardEntry')
  .implement({
    fields: (t) => ({
      rank: t.exposeInt('rank'),
      score: t.exposeInt('score'),
      userId: t.exposeString('userId'),
      user: t.prismaField({
        type: UserRef,
        resolve: async (query, parent) =>
          prisma.user.findUniqueOrThrow({
            ...query,
            where: { id: parent.userId },
          }),
      }),
    }),
  })

function withRanks(
  rows: Array<{ userId: string; score: number }>,
): RankRow[] {
  return rows
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({
      userId: row.userId,
      score: row.score,
      rank: index + 1,
    }))
}

async function rankByGroup(
  model: 'spotCheck' | 'session' | 'spot' | 'spotCompetition' | 'offer',
  userField: string,
  take: number,
  where?: Record<string, unknown>,
): Promise<RankRow[]> {
  const grouped = await (prisma[model] as any).groupBy({
    by: [userField],
    where,
    _count: { _all: true },
    orderBy: { _count: { [userField]: 'desc' } },
    take,
  })

  return withRanks(
    grouped.map((row: any) => ({
      userId: row[userField] as string,
      score: row._count._all as number,
    })),
  )
}

async function marketplaceActivityRanks(take: number): Promise<RankRow[]> {
  const [listings, sales, purchases] = await Promise.all([
    prisma.offer.groupBy({
      by: ['userId'],
      _count: { _all: true },
    }),
    prisma.offer.groupBy({
      by: ['userId'],
      where: { concludedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.offer.groupBy({
      by: ['buyerId'],
      where: { buyerId: { not: null }, concludedAt: { not: null } },
      _count: { _all: true },
    }),
  ])

  const scores = new Map<string, number>()
  const add = (userId: string | null | undefined, n: number) => {
    if (!userId) return
    scores.set(userId, (scores.get(userId) ?? 0) + n)
  }

  for (const row of listings) add(row.userId, row._count._all)
  for (const row of sales) add(row.userId, row._count._all)
  for (const row of purchases) add(row.buyerId, row._count._all)

  return withRanks(
    [...scores.entries()].map(([userId, score]) => ({ userId, score })),
  ).slice(0, take)
}

async function followerRanks(take: number): Promise<RankRow[]> {
  const grouped = await prisma.follower.groupBy({
    by: ['followingId'],
    _count: { _all: true },
    orderBy: { _count: { followingId: 'desc' } },
    take,
  })

  return withRanks(
    grouped.map((row) => ({
      userId: row.followingId,
      score: row._count._all,
    })),
  )
}

type LeaderboardsParent = { take: number }

const LeaderboardsRef = builder
  .objectRef<LeaderboardsParent>('Leaderboards')
  .implement({
    fields: (t) => ({
      spotChecks: t.field({
        type: [LeaderboardEntryRef],
        resolve: (parent) =>
          rankByGroup('spotCheck', 'userId', parent.take),
      }),
      sessions: t.field({
        type: [LeaderboardEntryRef],
        resolve: (parent) => rankByGroup('session', 'userId', parent.take),
      }),
      spotsCreated: t.field({
        type: [LeaderboardEntryRef],
        resolve: async (parent) => {
          const grouped = await prisma.spot.groupBy({
            by: ['createdById'],
            where: { createdById: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { createdById: 'desc' } },
            take: parent.take,
          })
          return withRanks(
            grouped
              .filter((row) => row.createdById)
              .map((row) => ({
                userId: row.createdById as string,
                score: row._count._all,
              })),
          )
        },
      }),
      competitionsCreated: t.field({
        type: [LeaderboardEntryRef],
        resolve: async (parent) => {
          const grouped = await prisma.spotCompetition.groupBy({
            by: ['createdById'],
            where: { createdById: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { createdById: 'desc' } },
            take: parent.take,
          })
          return withRanks(
            grouped
              .filter((row) => row.createdById)
              .map((row) => ({
                userId: row.createdById as string,
                score: row._count._all,
              })),
          )
        },
      }),
      marketplaceActivity: t.field({
        type: [LeaderboardEntryRef],
        resolve: (parent) => marketplaceActivityRanks(parent.take),
      }),
      followers: t.field({
        type: [LeaderboardEntryRef],
        resolve: (parent) => followerRanks(parent.take),
      }),
    }),
  })

builder.queryField('leaderboards', (t) =>
  t.field({
    type: LeaderboardsRef,
    args: {
      take: t.arg.int(),
    },
    resolve: (_root, args) => ({
      take: Math.min(Math.max(args.take ?? 10, 1), 50),
    }),
  }),
)
