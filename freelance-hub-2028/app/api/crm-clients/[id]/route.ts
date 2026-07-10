import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, tags: row.tags ? JSON.parse(row.tags as string) : [], starred: !!row.starred }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const row = await queryOne(`SELECT * FROM crm_clients WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(row))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM crm_clients WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  for (const f of ['name','company','email','phone','website','stage','value','avatar','avatarBg','lastContact','rating','notes']) {
    if (body[f] !== undefined) next[f] = body[f]
  }
  if (body.tags !== undefined) next.tags = JSON.stringify(body.tags)
  if (body.starred !== undefined) next.starred = body.starred ? 1 : 0
  const lastContactAt = new Date().toISOString()
  await execute(
    `UPDATE crm_clients SET name=?,company=?,email=?,phone=?,website=?,stage=?,value=?,avatar=?,avatarBg=?,tags=?,lastContact=?,last_contact_at=?,starred=?,rating=?,notes=? WHERE id=? AND user_id=?`,
    [next.name, next.company, next.email, next.phone, next.website, next.stage, next.value, next.avatar, next.avatarBg, next.tags, next.lastContact, lastContactAt, next.starred, next.rating, next.notes, id, user.id]
  )
  if (body.stage !== undefined && body.stage !== existing.stage) {
    logActivity(user.id, `Moved ${existing.name} to ${body.stage} stage`)
  }
  const row = await queryOne(`SELECT * FROM crm_clients WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne<{ name: string }>(`SELECT name FROM crm_clients WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM crm_clients WHERE id = ? AND user_id = ?`, [id, user.id])
  logActivity(user.id, `Removed CRM lead: ${existing.name}`)
  return NextResponse.json({ success: true })
}
