// src/graphql/schema.ts

import { builder } from './builder'

import './objects'
import './queries'
import './mutations'

export const schema = builder.toSchema()