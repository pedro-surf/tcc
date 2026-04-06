import { builder } from '../builder'

export const DeviceRef = builder.prismaObject('Device', {
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    createdBy: t.exposeString('createdBy', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    creator: t.relation('creator', { nullable: true }),
  }),
});