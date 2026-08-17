import { builder, prisma } from '../builder'
import { waveAverage } from '../utils/waveAverage'

export const HeatSurferRef = builder.prismaObject('HeatSurfer', {
  fields: (t) => ({
    id: t.exposeID('id'),
    heatId: t.exposeString('heatId'),
    userId: t.exposeString('userId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    heat: t.relation('heat'),
    user: t.relation('user'),
    waves: t.relation('waves', {
      query: () => ({
        orderBy: { elapsedSec: 'asc' },
      }),
    }),
    heatTotal: t.float({
      resolve: async (surfer) => {
        const waves = await prisma.heatWave.findMany({
          where: { surferId: surfer.id },
          select: { id: true },
        })
        const averages: number[] = []
        for (const wave of waves) {
          const avg = await waveAverage(wave.id)
          if (avg != null) averages.push(avg)
        }
        if (averages.length === 0) return 0
        const best = [...averages].sort((a, b) => b - a).slice(0, 2)
        return best.reduce((sum, n) => sum + n, 0)
      },
    }),
  }),
})
