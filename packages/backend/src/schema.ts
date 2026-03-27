import { builder } from "./builder";
// This file is created by 'prisma-generator-pothos-codegen'
import { autoGenerateQueriesAndMutations } from "./generated/pothos-crud"; 

autoGenerateQueriesAndMutations(builder);

export const schema = builder.toSchema();