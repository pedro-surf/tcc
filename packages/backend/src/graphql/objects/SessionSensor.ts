import { builder } from '../builder'

export const SessionSensorRef = builder.prismaObject('SessionSensor', {
  fields: (t) => ({
    id: t.exposeID('id'),
    sessionId: t.exposeString('sessionId'),
    sensorId: t.exposeString('sensorId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    session: t.relation('session'),
    sensor: t.relation('sensor'),
  }),
});