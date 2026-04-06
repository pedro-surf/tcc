import { builder } from '../builder'

export const SampleRef = builder.prismaObject('Sample', {
  fields: (t) => ({
    id: t.exposeID('id'),
    timestamp: t.exposeFloat('timestamp'),
    ax: t.exposeFloat('ax'),
    ay: t.exposeFloat('ay'),
    az: t.exposeFloat('az'),
    gx: t.exposeFloat('gx'),
    gy: t.exposeFloat('gy'),
    gz: t.exposeFloat('gz'),
    lat: t.exposeFloat('lat', { nullable: true }),
    lon: t.exposeFloat('lon', { nullable: true }),
    fix: t.exposeInt('fix', { nullable: true }),
    alt: t.exposeFloat('alt', { nullable: true }),
    sat: t.exposeInt('sat', { nullable: true }),
    sessionId: t.exposeString('sessionId'),
    session: t.relation('session'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});