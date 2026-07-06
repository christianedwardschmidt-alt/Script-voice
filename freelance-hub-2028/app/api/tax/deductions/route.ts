import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_deductions WHERE user_id = ? ORDER BY id ASC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { category, amount, icon, max, color } = body
  const result = await execute(
    `INSERT INTO tax_deductions (user_id, category, amount, icon, max, color) VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, category, amount ?? 0, icon ?? '📁', max ?? 5400, color ?? '#16a34a']
  )
  logActivity(user.id, `Added tax deduction: ${category}`)
  const row = await queryOne(`SELECT * FROM tax_deductions WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
