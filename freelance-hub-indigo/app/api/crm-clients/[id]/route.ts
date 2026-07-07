import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    starred: !!row.starred,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await db.execute({ sql: `SELECT * FROM crm_clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(toRow(res.rows[0])))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM crm_clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['name', 'company', 'email', 'phone', 'website', 'stage', 'value', 'avatar', 'avatarBg', 'lastContact', 'rating', 'notes']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]
  if (body.tags !== undefined) next.tags = JSON.stringify(body.tags)
  if (body.starred !== undefined) next.starred = body.starred ? 1 : 0

  await db.execute({
    sql: `UPDATE crm_clients SET name=?, company=?, email=?, phone=?, website=?, stage=?, value=?, avatar=?, avatarBg=?, tags=?, lastContact=?, starred=?, rating=?, notes=? WHERE id=? AND user_id=?`,
    args: [next.name, next.company, next.email, next.phone, next.website, next.stage, next.value, next.avatar, next.avatarBg, next.tags, next.lastContact, next.starred, next.rating, next.notes, id, user.id],
  })

  if (body.stage !== undefined && body.stage !== existing.rows[0].stage) {
    await logActivity(user.id, `Moved ${existing.rows[0].name} to ${body.stage} stage`)
  }

  const row = await db.execute({ sql: `SELECT * FROM crm_clients WHERE id = ?`, args: [id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT name FROM crm_clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute({ sql: `DELETE FROM crm_clients WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  await logActivity(user.id, `Removed CRM lead: ${existing.rows[0].name}`)
  return NextResponse.json({ success: true })
}
