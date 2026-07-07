import { NextRequest, NextResponse } from 'next/server'
import { db, toRow } from '@/lib/db'
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

    const res = await db.execute({
      sql: `SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?`,
      args: [token],
    })
    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
    }
    const row = toRow(res.rows[0]) as { user_id: number; expires_at: string }

    if (new Date(row.expires_at) < new Date()) {
      await db.execute({ sql: `DELETE FROM password_reset_tokens WHERE token = ?`, args: [token] })
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)
    await db.batch([
      { sql: `UPDATE users SET password_hash = ? WHERE id = ?`, args: [passwordHash, row.user_id] },
      { sql: `DELETE FROM password_reset_tokens WHERE token = ?`, args: [token] },
      { sql: `DELETE FROM sessions WHERE user_id = ?`, args: [row.user_id] },
    ], 'write')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Reset failed: ${msg}` }, { status: 500 })
  }
}
