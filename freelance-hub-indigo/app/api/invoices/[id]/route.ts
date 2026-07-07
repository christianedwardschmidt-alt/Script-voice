import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await db.execute({ sql: `SELECT * FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toRow(res.rows[0]))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['client', 'project', 'amount', 'status', 'issued', 'due', 'avatar', 'color']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await db.execute({
    sql: `UPDATE invoices SET client=?, project=?, amount=?, status=?, issued=?, due=?, avatar=?, color=? WHERE id=? AND user_id=?`,
    args: [next.client, next.project, next.amount, next.status, next.issued, next.due, next.avatar, next.color, id, user.id],
  })

  if (body.status !== undefined && body.status !== existing.rows[0].status) {
    await logActivity(user.id, `Invoice ${id} marked as ${body.status}`)
  }

  const row = await db.execute({ sql: `SELECT * FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  return NextResponse.json(toRow(row.rows[0]))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT id FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute({ sql: `DELETE FROM invoices WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  await logActivity(user.id, `Deleted invoice ${id}`)
  return NextResponse.json({ success: true })
}
