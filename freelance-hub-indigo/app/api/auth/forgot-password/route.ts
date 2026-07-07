import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import db from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const user = db
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .get(email.toLowerCase().trim()) as { id: number } | undefined

    // Always return success to avoid leaking whether an email exists
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Delete any existing tokens for this user
    db.prepare(`DELETE FROM password_reset_tokens WHERE user_id = ?`).run(user.id)

    const token = randomBytes(32).toString('hex')
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    db.prepare(
      `INSERT INTO password_reset_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`
    ).run(token, user.id, now, expiresAt)

    return NextResponse.json({ ok: true, token })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Request failed: ${msg}` }, { status: 500 })
  }
}
