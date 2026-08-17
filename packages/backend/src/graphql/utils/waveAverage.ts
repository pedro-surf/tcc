import { prisma } from '../builder'

export async function waveAverage(waveId: string): Promise<number | null> {
  const scores = await prisma.heatWaveScore.findMany({
    where: { waveId },
    select: { score: true },
  })
  if (scores.length === 0) return null
  return scores.reduce((sum, row) => sum + row.score, 0) / scores.length
}
