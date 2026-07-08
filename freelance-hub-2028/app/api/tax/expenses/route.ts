import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_expenses WHERE user_id = ? ORDER BY date DESC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { date, description, category, amount, notes } = body
  const result = await execute(
    `INSERT INTO tax_expenses (user_id, date, description, category, amount, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, date, description, category, amount ?? 0, notes ?? '']
  )
  logActivity(user.id, `Added expense: ${description} ($${amount})`)
  const row = await queryOne(`SELECT * FROM tax_expenses WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
