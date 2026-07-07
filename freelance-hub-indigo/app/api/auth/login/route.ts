import { NextRequest, NextResponse } from 'next/server'
import { db, toRow } from '@/lib/db'
import { verifyPassword, generateToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const res = await db.execute({
      sql: `SELECT id, name, password_hash FROM users WHERE email = ?`,
      args: [email.toLowerCase().trim()],
    })
    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }
    const user = toRow(res.rows[0]) as { id: number; name: string; password_hash: string }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = generateToken()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()

    await db.execute({
      sql: `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      args: [token, user.id, now, expiresAt],
    })

    const result = NextResponse.json({ ok: true, name: user.name })
    result.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 86400,
      path: '/',
    })
    return result
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Login failed: ${msg}` }, { status: 500 })
  }
}
