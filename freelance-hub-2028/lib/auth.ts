import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { queryOne } from './db'

export type SessionUser = { id: number; email: string; name: string }

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64)
  return `${salt}:${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const hashBuffer = Buffer.from(hash, 'hex')
    const derived = scryptSync(password, salt, 64) as Buffer
    return timingSafeEqual(hashBuffer, derived)
  } catch {
    return false
  }
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function getUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('gw_session')?.value
    if (!token) return null

    const session = await queryOne<{ user_id: number; expires_at: string }>(
      `SELECT user_id, expires_at FROM sessions WHERE token = ?`,
      [token]
    )
    if (!session) return null
    if (new Date(session.expires_at) < new Date()) return null

    return queryOne<SessionUser>(
      `SELECT id, email, name FROM users WHERE id = ?`,
      [session.user_id]
    )
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'gw_session'
export const SESSION_DAYS = 30
