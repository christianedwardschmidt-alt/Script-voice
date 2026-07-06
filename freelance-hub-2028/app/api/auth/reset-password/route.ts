import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const reset = await queryOne<{ email: string; expires_at: string }>(
      `SELECT email, expires_at FROM password_resets WHERE token = ?`, [token]
    )
    if (!reset) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
    }
    if (new Date(reset.expires_at) < new Date()) {
      await execute(`DELETE FROM password_resets WHERE token = ?`, [token])
      return NextResponse.json({ error: 'This reset link has expired. Request a new one.' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)
    await execute(`UPDATE users SET password_hash = ? WHERE email = ?`, [passwordHash, reset.email])
    await execute(`DELETE FROM password_resets WHERE token = ?`, [token])
    // Invalidate all existing sessions
    const user = await queryOne<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [reset.email])
    if (user) await execute(`DELETE FROM sessions WHERE user_id = ?`, [user.id])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed: ${msg}` }, { status: 500 })
  }
}
