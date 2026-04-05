import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import { PrismaClient, Prisma } from '@prisma/client'
import type PrismaTypes from '@pothos/plugin-prisma/generated'

export const prisma = new PrismaClient({

})

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
}>({
  notStrict: "Pothos may not work correctly when strict mode is not enabled in tsconfig.json",
  plugins: [PrismaPlugin],
  prisma: {
    dmmf: Prisma.dmmf,
    client: prisma,
  },
})

builder.mutationType({})
builder.queryType({});

export default { builder, prisma }