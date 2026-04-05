import PrismaTypes from '@pothos/plugin-prisma/generated'
import { builder, prisma } from '../builder'

export function createCreateMutation<T extends keyof typeof prisma>(
  model: T,
  type: keyof PrismaTypes,
  inputFields: (t: any) => any
) {
  builder.mutationField(`create${type}`, (t) =>
    t.prismaField({
      type,

      args: {
        data: t.arg({
          type: builder.inputType(`${type}CreateInput`, {
            fields: inputFields,
          }),
          required: true,
        }),
      },

      resolve: (query, _parent, args) =>
        (prisma[model] as any).create({
          ...query,
          data: args.data,
        }),
    })
  )
}