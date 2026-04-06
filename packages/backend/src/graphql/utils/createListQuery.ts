import { builder, prisma } from '../builder'
import { PrismaClient } from '@prisma/client'
import type { PrismaObjectRef } from '@pothos/plugin-prisma'

interface ListQueryOptions<TArgs extends Record<string, any> = {}> {
  /**
   * Optional function returning filter arguments
   */
  filterFields?: (t: any) => TArgs
}

/**
 * Generic helper to create a list query for any Prisma model
 *
 * @param modelName Prisma model name (key of prisma client)
 * @param objectRef Pothos PrismaObjectRef for the GraphQL type
 * @param options optional filter args
 */
export function createListQuery<
  TModel extends keyof PrismaClient,
  TRef extends PrismaObjectRef<any, any>,
  TArgs extends Record<string, any> = {}
>(
  modelName: TModel,
  objectRef: TRef,
  options?: ListQueryOptions<TArgs>
) {
  const fieldName = `${objectRef.name.toLowerCase()}s` // pluralize field

  builder.queryField(fieldName, (t) =>
    t.prismaField({
      type: [objectRef],
      args: {
        skip: t.arg.int(),
        take: t.arg.int(),
        ...(options?.filterFields ? options.filterFields(t) : {}),
      },
      resolve: (query, _parent, args) => {
        // build 'where' object from filter args
        const where: Record<string, any> = {}
        if (options?.filterFields) {
          Object.keys(args).forEach((key) => {
            if (key !== 'skip' && key !== 'take' && args[key] != null) {
              // simple contains filter for strings
              where[key] =
                typeof args[key] === 'string'
                  ? { contains: args[key] }
                  : args[key]
            }
          })
        }

        // call Prisma findMany
        return (prisma[modelName] as any).findMany({
          ...query,
          skip: args.skip,
          take: args.take,
          where: Object.keys(where).length > 0 ? where : undefined,
        })
      },
    })
  )
}