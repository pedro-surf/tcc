import PrismaTypes from '@pothos/plugin-prisma/generated';
import { builder, prisma } from '../builder';

const inputTypeCache = new Map<string, any>();

const getInputType = (
  type: keyof PrismaTypes,
  inputFields: (t: any) => any
) => {
  const typeName = `${type}CreateInput`;
  if (!inputTypeCache.has(typeName)) {
    const inputType = builder.inputType(typeName, {
      fields: inputFields,
    });
    inputTypeCache.set(typeName, inputType);
  }
  return inputTypeCache.get(typeName);
};

export function createCreateMutation<T extends keyof typeof prisma>(
  model: T,
  type: keyof PrismaTypes,
  inputFields: (t: any) => any,
  { bulk = false } = {}
) {
  const inputType = getInputType(type, inputFields);

  builder.mutationField(`create${type}`, (t) =>
    t.prismaField({
      type,
      args: {
        data: t.arg({
          type: inputType,
          required: true,
        }),
      },
      resolve: (query, _parent, args) => {
        return (prisma[model] as any).create({
          ...query,
          data: args.data,
        });
      },
    })
  );

  if (bulk) {
    builder.mutationField(`bulkCreate${type}`, (t) =>
      t.prismaField({
        type: [type],
        args: {
          data: t.arg({
            type: [inputType],
            required: true,
          }),
        },
        resolve: async (query, _parent, args) => {
          await (prisma[model] as any).createMany({
            data: args.data,
          });
          return args.data; // Return the created objects
        },
      })
    );
  }
}