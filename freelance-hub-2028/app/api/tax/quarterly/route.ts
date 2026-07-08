import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_quarterly_payments WHERE user_id = ? ORDER BY year DESC, quarter ASC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { quarter, year, paid_amount, paid_date } = body
  const result = await execute(
    `INSERT INTO tax_quarterly_payments (user_id, quarter, year, paid_amount, paid_date) VALUES (?, ?, ?, ?, ?)`,
    [user.id, quarter, year ?? 2026, paid_amount ?? 0, paid_date]
  )
  logActivity(user.id, `Marked ${quarter} ${year} tax payment as paid ($${paid_amount})`)
  const row = await queryOne(`SELECT * FROM tax_quarterly_payments WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
