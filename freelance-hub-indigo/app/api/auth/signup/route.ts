import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { hashPassword, generateToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = db
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .get(email.toLowerCase().trim())

    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)
    const now = new Date().toISOString()

    const result = db
      .prepare(`INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)`)
      .run(email.toLowerCase().trim(), name.trim(), passwordHash, now) as { lastInsertRowid: number }

    const userId = result.lastInsertRowid
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()

    db.prepare(`INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
      .run(token, userId, now, expiresAt)

    const res = NextResponse.json({ ok: true, name: name.trim() })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 86400,
      path: '/',
    })
    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Signup failed: ${msg}` }, { status: 500 })
  }
}
