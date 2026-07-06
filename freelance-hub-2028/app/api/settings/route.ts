import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
    workspaceName: row.workspaceName ?? 'My Studio',
  }
}

const defaults = { notifications: true, twoFactor: false, darkMode: false, invoiceAutoSend: true, weeklyDigest: true, workspaceName: 'My Studio' }

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ? deserialize(row) : defaults)
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  const body = await request.json()
  const next: Record<string, unknown> = { ...(existing ?? { notifications: 1, twoFactor: 0, darkMode: 0, invoiceAutoSend: 1, weeklyDigest: 1, workspaceName: 'My Studio' }) }
  const boolFields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest']
  for (const f of boolFields) if (body[f] !== undefined) next[f] = body[f] ? 1 : 0
  if (body.workspaceName !== undefined) next.workspaceName = body.workspaceName

  if (existing) {
    await execute(
      `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=?, workspaceName=? WHERE user_id=?`,
      [next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName, user.id]
    )
  } else {
    await execute(
      `INSERT INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName) VALUES (?,?,?,?,?,?,?)`,
      [user.id, next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName]
    )
  }

  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(deserialize(row!))
}
