// src/graphql/schema.ts

import { builder } from './builder'

import './objects'
import './enums'
import './queries'
import './mutations'

export const schema = builder.toSchema()