import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import { PrismaClient, Prisma } from '@prisma/client'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
//import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';

export const prisma = new PrismaClient({

})

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: string | Date; Output: string | Date };
    Json: { Input: any; Output: any };
  };
  Context: {
    ip: string;
    req: import('node:http').IncomingMessage;
    user: import('@prisma/client').User | null;
  };
}>({
  notStrict: "Pothos may not work correctly when strict mode is not enabled in tsconfig.json",
  plugins: [PrismaPlugin],
  prisma: {
    dmmf: Prisma.dmmf,
    client: prisma,
  },
})

builder.scalarType('DateTime', {
  serialize: (date: string | Date) => typeof date === "string" ?
  new Date(date).toISOString() : date.toISOString(), // output as ISO string
});

builder.scalarType('Json', {
  serialize: (value) => value, // passthrough
  parseValue: (value) => value, // passthrough
  parseLiteral: (ast) => {
    switch (ast.kind) {
      case 'ObjectValue':
      case 'ListValue':
        return ast; // or throw if you want stricter parsing
      case 'StringValue':
        try { return JSON.parse(ast.value); } catch { return null; }
      default:
        return null;
    }
  },
});
builder.mutationType({})
builder.queryType({});

export default { builder, prisma }