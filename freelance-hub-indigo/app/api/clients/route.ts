import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM clients WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, company, email, phone, website, avatar, color, status, revenue, projects } = body

  const res = await db.execute({
    sql: `INSERT INTO clients (user_id, name, company, email, phone, website, avatar, color, status, revenue, projects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [user.id, name, company, email ?? null, phone ?? null, website ?? null, avatar ?? '👤', color ?? '#15803d', status ?? 'active', revenue ?? 0, projects ?? 0],
  })

  await logActivity(user.id, `Added new client: ${name}`)
  const row = await db.execute({ sql: `SELECT * FROM clients WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(toRow(row.rows[0]), { status: 201 })
}
