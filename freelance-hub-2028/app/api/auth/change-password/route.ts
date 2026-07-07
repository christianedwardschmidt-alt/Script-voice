import { NextRequest, NextResponse } from 'next/server'
import { getUser, verifyPassword, hashPassword } from '@/lib/auth'
import { queryOne, execute } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    const row = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = ?`, [user.id]
    )
    if (!row || !verifyPassword(currentPassword, row.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    await execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [hashPassword(newPassword), user.id])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed: ${msg}` }, { status: 500 })
  }
}
