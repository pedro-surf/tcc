import { builder } from '../builder'

export const SensorRef = builder.prismaObject('Sensor', {
    fields: (t) => ({
      id: t.exposeID('id'),
      type: t.exposeString('type'),
      data: t.expose('data', { type: 'Json' }),
      recordedAt: t.expose('recordedAt', { type: 'DateTime' }),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      sessionSensors: t.relation('sessionSensors'),
    }),
  });