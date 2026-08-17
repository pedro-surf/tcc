import { builder } from '../builder'

export const HeatWaveScoreRef = builder.prismaObject('HeatWaveScore', {
  fields: (t) => ({
    id: t.exposeID('id'),
    waveId: t.exposeString('waveId'),
    judgeIndex: t.exposeInt('judgeIndex'),
    score: t.exposeFloat('score'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    wave: t.relation('wave'),
  }),
})
