import { builder, prisma } from '../builder'
import PrismaTypes from '@pothos/plugin-prisma/generated'

export function createListQuery<T extends keyof typeof prisma>(
  model: T,
  type: keyof PrismaTypes
) {
  builder.queryField(`${String(type).toLowerCase()}s`, (t) =>
    t.prismaField({
      type: [type],
      resolve: (query) => (prisma[model] as any).findMany({ ...query }),
    })
  )
}