import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const row = db
      .prepare(`SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?`)
      .get(token) as { user_id: number; expires_at: string } | undefined

    if (!row) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
    }
    if (new Date(row.expires_at) < new Date()) {
      db.prepare(`DELETE FROM password_reset_tokens WHERE token = ?`).run(token)
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, row.user_id)
    db.prepare(`DELETE FROM password_reset_tokens WHERE token = ?`).run(token)
    // Invalidate all existing sessions for this user
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(row.user_id)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Reset failed: ${msg}` }, { status: 500 })
  }
}
