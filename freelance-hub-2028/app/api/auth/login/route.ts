import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { verifyPassword, generateToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const user = await queryOne<{ id: number; name: string; password_hash: string }>(
    `SELECT id, name, password_hash FROM users WHERE email = ?`,
    [email.toLowerCase()]
  )

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await execute(
    `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    [token, user.id, new Date().toISOString(), expiresAt]
  )

  const res = NextResponse.json({ ok: true, name: user.name })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400,
    path: '/',
  })
  return res
}
