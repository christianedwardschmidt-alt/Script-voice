import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  for (const f of ['client','project','amount','status','issued','due','avatar','color']) {
    if (body[f] !== undefined) next[f] = body[f]
  }
  await execute(
    `UPDATE invoices SET client=?,project=?,amount=?,status=?,issued=?,due=?,avatar=?,color=? WHERE id=? AND user_id=?`,
    [next.client, next.project, next.amount, next.status, next.issued, next.due, next.avatar, next.color, id, user.id]
  )
  if (body.status !== undefined && body.status !== existing.status) {
    logActivity(user.id, `Invoice ${id} marked as ${body.status}`)
  }
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  return NextResponse.json(row)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne(`SELECT id FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  logActivity(user.id, `Deleted invoice ${id}`)
  return NextResponse.json({ success: true })
}
