import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, createUserDefaults } from '@/lib/db'
import { hashPassword, generateToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()])
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)
    const result = await execute(
      `INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      [email.toLowerCase(), name.trim(), passwordHash, new Date().toISOString()]
    )
    const userId = result.lastInsertRowid

    await createUserDefaults(userId, name.trim(), email.toLowerCase())

    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
    await execute(
      `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      [token, userId, new Date().toISOString(), expiresAt]
    )

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
    console.error('[signup]', msg)
    return NextResponse.json({ error: `Signup failed: ${msg}` }, { status: 500 })
  }
}
