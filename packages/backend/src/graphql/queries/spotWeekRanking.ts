import { builder, prisma } from '../builder'
import type { Context } from '../context'
import { SpotWeekRankRef } from '../objects/SpotWeekRank'
import { spotVisibilityWhere } from '../utils/spotVisibility'
import { nextWeekRange } from '../../forecast/conditionVector'
import { rankSpotsForWeek } from '../../forecast/rankSpotsForWeek'

builder.queryField('spotWeekRanking', (t) =>
  t.field({
    type: [SpotWeekRankRef],
    args: {
      take: t.arg.int(),
    },
    resolve: async (_root, args, ctx: Context) => {
      const visibility = await spotVisibilityWhere(ctx)
      const spots = await prisma.spot.findMany({
        where: visibility,
        select: { id: true },
      })
      const range = nextWeekRange()
      return rankSpotsForWeek({
        spotIds: spots.map((spot) => spot.id),
        take: args.take ?? 20,
        from: range.from,
        to: range.to,
      })
    },
  }),
)
