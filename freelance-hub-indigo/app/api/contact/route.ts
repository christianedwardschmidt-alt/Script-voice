import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM contact_info WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(res.rows[0] ? toRow(res.rows[0]) : null)
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.execute({ sql: `SELECT * FROM contact_info WHERE user_id = ?`, args: [user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['fullName', 'email', 'phone', 'website', 'location', 'timezone', 'bio']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await db.execute({
    sql: `UPDATE contact_info SET fullName=?, email=?, phone=?, website=?, location=?, timezone=?, bio=? WHERE user_id=?`,
    args: [next.fullName, next.email, next.phone, next.website, next.location, next.timezone, next.bio, user.id],
  })

  await logActivity(user.id, 'Updated contact info')
  const row = await db.execute({ sql: `SELECT * FROM contact_info WHERE user_id = ?`, args: [user.id] })
  return NextResponse.json(toRow(row.rows[0]))
}
