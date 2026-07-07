import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await db.execute({ sql: `SELECT * FROM clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toRow(res.rows[0]))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['name', 'company', 'email', 'phone', 'website', 'avatar', 'color', 'status', 'revenue', 'projects']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await db.execute({
    sql: `UPDATE clients SET name=?, company=?, email=?, phone=?, website=?, avatar=?, color=?, status=?, revenue=?, projects=? WHERE id=? AND user_id=?`,
    args: [next.name, next.company, next.email, next.phone, next.website, next.avatar, next.color, next.status, next.revenue, next.projects, id, user.id],
  })

  const row = await db.execute({ sql: `SELECT * FROM clients WHERE id = ?`, args: [id] })
  return NextResponse.json(toRow(row.rows[0]))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT name FROM clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute({ sql: `DELETE FROM clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  await logActivity(user.id, `Removed client: ${existing.rows[0].name}`)
  return NextResponse.json({ success: true })
}
