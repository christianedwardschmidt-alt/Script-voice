import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  for (const f of ['client','project','amount','status','issued','due','avatar','color']) {
    if (body[f] !== undefined) next[f] = body[f]
  }

  await execute(
    `UPDATE invoices SET client=?,project=?,amount=?,status=?,issued=?,due=?,avatar=?,color=? WHERE id=?`,
    [next.client, next.project, next.amount, next.status, next.issued, next.due, next.avatar, next.color, id]
  )

  if (body.status !== undefined && body.status !== existing.status) {
    logActivity(`Invoice ${id} marked as ${body.status}`)
  }
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  return NextResponse.json(row)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT id FROM invoices WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM invoices WHERE id = ?`, [id])
  logActivity(`Deleted invoice ${id}`)
  return NextResponse.json({ success: true })
}
