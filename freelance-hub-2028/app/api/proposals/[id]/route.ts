import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const rows = await queryAll(`SELECT * FROM proposals WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  const allowed = [
    'title','client_name','client_email','client_id','project_type','status','valid_until',
    'introduction','problem','solution','deliverables','milestones','line_items',
    'payment_terms','about_me','terms','subtotal','discount','total',
    'sent_at','accepted_at','declined_at','accepted_by',
  ]
  const updates = Object.entries(body).filter(([k]) => allowed.includes(k))
  if (!updates.length) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values = updates.map(([, v]) => v as any)
  await execute(
    `UPDATE proposals SET ${setClauses}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    [...values, id, user.id]
  )
  const rows = await queryAll(`SELECT * FROM proposals WHERE id = ?`, [id])
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`DELETE FROM proposals WHERE id = ? AND user_id = ?`, [id, user.id])
  return NextResponse.json({ ok: true })
}
