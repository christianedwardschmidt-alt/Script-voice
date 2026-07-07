import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM tax_deductions WHERE user_id = ? ORDER BY id ASC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { category, amount, icon, max, color } = body

  const res = await db.execute({
    sql: `INSERT INTO tax_deductions (user_id, category, amount, icon, max, color) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [user.id, category, amount ?? 0, icon ?? '📁', max ?? 5400, color ?? '#15803d'],
  })

  await logActivity(user.id, `Added tax deduction: ${category}`)
  const row = await db.execute({ sql: `SELECT * FROM tax_deductions WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(toRow(row.rows[0]), { status: 201 })
}
