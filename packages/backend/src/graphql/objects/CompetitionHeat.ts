import { builder } from '../builder'
import HeatStatusEnum from '../enums/HeatStatus'

function remainingSeconds(
  startedAt: Date | null,
  durationMin: number,
  status: string,
  endedAt: Date | null,
) {
  const total = durationMin * 60
  if (status === 'FINISHED' && endedAt && startedAt) {
    return Math.max(
      0,
      total - Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    )
  }
  if (!startedAt || status === 'PENDING') return total
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
  return Math.max(0, total - elapsed)
}

export const CompetitionHeatRef = builder.prismaObject('CompetitionHeat', {
  fields: (t) => ({
    id: t.exposeID('id'),
    competitionId: t.exposeString('competitionId'),
    name: t.exposeString('name'),
    judgeCount: t.exposeInt('judgeCount'),
    durationMin: t.exposeInt('durationMin'),
    status: t.expose('status', { type: HeatStatusEnum }),
    startedAt: t.expose('startedAt', { type: 'DateTime', nullable: true }),
    endedAt: t.expose('endedAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    remainingSec: t.int({
      resolve: (heat) =>
        remainingSeconds(
          heat.startedAt,
          heat.durationMin,
          heat.status,
          heat.endedAt,
        ),
    }),
    competition: t.relation('competition'),
    surfers: t.relation('surfers', {
      query: () => ({
        orderBy: { createdAt: 'asc' },
      }),
    }),
    waves: t.relation('waves', {
      query: () => ({
        orderBy: { elapsedSec: 'asc' },
      }),
    }),
  }),
})
