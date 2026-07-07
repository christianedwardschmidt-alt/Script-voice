import { NextRequest, NextResponse } from 'next/server'
import { db, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM settings WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(res.rows[0] ? deserialize(toRow(res.rows[0])) : null)
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.execute({ sql: `SELECT * FROM settings WHERE user_id = ?`, args: [user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f] ? 1 : 0

  await db.execute({
    sql: `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=? WHERE user_id=?`,
    args: [next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, user.id],
  })

  const row = await db.execute({ sql: `SELECT * FROM settings WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}
