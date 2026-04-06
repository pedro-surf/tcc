import { builder } from '../builder'

export const SessionRef = builder.prismaObject('Session', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    spotId: t.exposeString('spotId'),
    boardId: t.exposeString('boardId', { nullable: true }),
    wetsuitId: t.exposeString('wetsuitId', { nullable: true }),
    date: t.expose('date', { type: 'DateTime' }),
    durationMin: t.exposeInt('durationMin'),
    waveCount: t.exposeInt('waveCount', { nullable: true }),
    maxWave: t.exposeFloat('maxWave', { nullable: true }),
    avgWave: t.exposeFloat('avgWave', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    spot: t.relation('spot'),
    board: t.relation('board', { nullable: true }),
    wetsuit: t.relation('wetsuit', { nullable: true }),
    sessionSensors: t.relation('sessionSensors'),
    likes: t.relation('likes'),
    sessionMedia: t.relation('sessionMedia'),
    sessionRatings: t.relation('sessionRatings'),
    samples: t.relation('samples'),
    manuevers: t.relation('manuevers'),
  }),
});