import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['client', 'project', 'amount', 'status', 'issued', 'due', 'avatar', 'color']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  db.prepare(
    `UPDATE invoices SET client=?, project=?, amount=?, status=?, issued=?, due=?, avatar=?, color=? WHERE id=?`
  ).run(next.client, next.project, next.amount, next.status, next.issued, next.due, next.avatar, next.color, id)

  if (body.status !== undefined && body.status !== existing.status) {
    logActivity(`Invoice ${id} marked as ${body.status}`)
  }

  const row = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id)
  return NextResponse.json(row)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  db.prepare(`DELETE FROM invoices WHERE id = ?`).run(id)
  logActivity(`Deleted invoice ${id}`)
  return NextResponse.json({ success: true })
}
