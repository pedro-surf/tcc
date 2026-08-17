import { builder, prisma } from '../builder'
import { waveAverage } from '../utils/waveAverage'

export const HeatWaveRef = builder.prismaObject('HeatWave', {
  fields: (t) => ({
    id: t.exposeID('id'),
    heatId: t.exposeString('heatId'),
    surferId: t.exposeString('surferId'),
    elapsedSec: t.exposeInt('elapsedSec'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    heat: t.relation('heat'),
    surfer: t.relation('surfer'),
    scores: t.relation('scores', {
      query: () => ({
        orderBy: { judgeIndex: 'asc' },
      }),
    }),
    averageScore: t.float({
      nullable: true,
      resolve: (wave) => waveAverage(wave.id),
    }),
    scoredCount: t.int({
      resolve: async (wave) =>
        prisma.heatWaveScore.count({ where: { waveId: wave.id } }),
    }),
  }),
})
