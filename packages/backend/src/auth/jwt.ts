import jwt from 'jsonwebtoken'

export type AuthTokenPayload = {
  sub: string
  email: string
}

const DEFAULT_SECRET = 'dev-surf-log-secret-change-me'

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.sub === 'string' &&
      typeof decoded.email === 'string'
    ) {
      return { sub: decoded.sub, email: decoded.email }
    }
    return null
  } catch {
    return null
  }
}
