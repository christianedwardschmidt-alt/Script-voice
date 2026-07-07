import { NextRequest, NextResponse } from 'next/server'
import { db, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM profile WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(res.rows[0] ? toRow(res.rows[0]) : null)
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.execute({ sql: `SELECT * FROM profile WHERE user_id = ?`, args: [user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['displayName', 'email', 'headline', 'skills']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await db.execute({
    sql: `UPDATE profile SET displayName=?, email=?, headline=?, skills=? WHERE user_id=?`,
    args: [next.displayName, next.email, next.headline, next.skills, user.id],
  })

  const row = await db.execute({ sql: `SELECT * FROM profile WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(toRow(row.rows[0]))
}
