import { NextRequest, NextResponse } from 'next/server'
import { db, createUserDefaults, toRow } from '@/lib/db'
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

    const existing = await db.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email.toLowerCase().trim()],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)
    const now = new Date().toISOString()

    const userRes = await db.execute({
      sql: `INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      args: [email.toLowerCase().trim(), name.trim(), passwordHash, now],
    })
    const userId = Number(userRes.lastInsertRowid!)

    await createUserDefaults(userId, name.trim(), email.toLowerCase().trim())

    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
    await db.execute({
      sql: `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      args: [token, userId, now, expiresAt],
    })

    const result = NextResponse.json({ ok: true, name: name.trim() })
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
    return NextResponse.json({ error: `Signup failed: ${msg}` }, { status: 500 })
  }
}
