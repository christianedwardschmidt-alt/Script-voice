import { NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { generateToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

const DEMO_COOKIE = 'gw_demo'

export async function POST() {
  const user = await queryOne<{ id: number; name: string }>(
    `SELECT id, name FROM users WHERE email = ?`,
    ['demo@guildwire.io']
  )

  if (!user) {
    return NextResponse.json({ error: 'Demo account not found.' }, { status: 500 })
  }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await execute(
    `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    [token, user.id, new Date().toISOString(), expiresAt]
  )

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400,
    path: '/',
  })
  res.cookies.set(DEMO_COOKIE, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400,
    path: '/',
  })
  return res
}
