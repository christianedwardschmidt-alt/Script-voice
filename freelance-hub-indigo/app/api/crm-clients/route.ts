import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    starred: !!row.starred,
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM crm_clients WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows).map(deserialize))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes } = body

  const res = await db.execute({
    sql: `INSERT INTO crm_clients (user_id, name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [user.id, name, company, email ?? null, phone ?? null, website ?? null, stage ?? 'Lead', value ?? 0, avatar ?? '👤', avatarBg ?? '#15803d', JSON.stringify(tags ?? []), lastContact ?? 'just now', starred ? 1 : 0, rating ?? 0, notes ?? ''],
  })

  await logActivity(user.id, `Added new CRM lead: ${name}`)
  const row = await db.execute({ sql: `SELECT * FROM crm_clients WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(deserialize(toRow(row.rows[0])), { status: 201 })
}
