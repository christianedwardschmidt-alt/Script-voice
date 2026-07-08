import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_mileage WHERE user_id = ? ORDER BY date DESC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { date, from_loc, to_loc, purpose, miles } = body
  const result = await execute(
    `INSERT INTO tax_mileage (user_id, date, from_loc, to_loc, purpose, miles) VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, date, from_loc, to_loc, purpose, miles ?? 0]
  )
  logActivity(user.id, `Logged ${miles} business miles`)
  const row = await queryOne(`SELECT * FROM tax_mileage WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
