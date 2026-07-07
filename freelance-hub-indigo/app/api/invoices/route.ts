import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client, project, amount, status, issued, due, avatar, color } = body

  const last = await db.execute({ sql: `SELECT id FROM invoices WHERE user_id = ? ORDER BY id DESC LIMIT 1`, args: [user.id] })
  let nextNum = 92
  if (last.rows[0]) {
    const m = String(last.rows[0].id).match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  const id = `INV-${String(nextNum).padStart(3, '0')}`

  await db.execute({
    sql: `INSERT INTO invoices (id, user_id, client, project, amount, status, issued, due, avatar, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, user.id, client, project ?? '', amount ?? 0, status ?? 'Draft', issued ?? '', due ?? '', avatar ?? '👤', color ?? '#15803d'],
  })

  await logActivity(user.id, `Created invoice ${id} for ${client}`)
  const row = await db.execute({ sql: `SELECT * FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  return NextResponse.json(toRow(row.rows[0]), { status: 201 })
}
