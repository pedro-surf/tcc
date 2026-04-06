// src/graphql/context.ts
import type { IncomingMessage } from 'node:http'

export interface Context {
  ip: string
  req: IncomingMessage
}

export function createContext({ req }: { req: IncomingMessage }): Context {
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  return { ip, req }
}