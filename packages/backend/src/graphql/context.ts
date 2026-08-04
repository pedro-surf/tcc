import type { IncomingMessage } from 'node:http'
import type { User } from '@prisma/client'
import { verifyAuthToken } from '../auth/jwt'
import { prisma } from './builder'

export interface Context {
  ip: string
  req: IncomingMessage
  user: User | null
}

function getBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export async function createContext({
  req,
}: {
  req: IncomingMessage
}): Promise<Context> {
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'

  let user: User | null = null
  const token = getBearerToken(req)
  if (token) {
    const payload = verifyAuthToken(token)
    if (payload) {
      user = await prisma.user.findUnique({ where: { id: payload.sub } })
    }
  }

  return { ip, req, user }
}

export function requireUser(ctx: Context): User {
  if (!ctx.user) {
    throw new Error('Authentication required')
  }
  return ctx.user
}
