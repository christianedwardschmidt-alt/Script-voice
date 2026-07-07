import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM tax_documents WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, status, date, size } = body

  const res = await db.execute({
    sql: `INSERT INTO tax_documents (user_id, name, status, date, size) VALUES (?, ?, ?, ?, ?)`,
    args: [user.id, name, status ?? 'In Progress', date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), size ?? '—'],
  })

  await logActivity(user.id, `Uploaded document: ${name}`)
  const row = await db.execute({ sql: `SELECT * FROM tax_documents WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(toRow(row.rows[0]), { status: 201 })
}
