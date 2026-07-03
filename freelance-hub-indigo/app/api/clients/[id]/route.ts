import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const fields = ['name', 'company', 'email', 'phone', 'website', 'avatar', 'color', 'status', 'revenue', 'projects']
  const next: Record<string, unknown> = { ...existing }
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  db.prepare(
    `UPDATE clients SET name=?, company=?, email=?, phone=?, website=?, avatar=?, color=?, status=?, revenue=?, projects=? WHERE id=?`
  ).run(next.name, next.company, next.email, next.phone, next.website, next.avatar, next.color, next.status, next.revenue, next.projects, id)

  const row = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id)
  return NextResponse.json(row)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id) as { name: string } | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  db.prepare(`DELETE FROM clients WHERE id = ?`).run(id)
  logActivity(`Removed client: ${existing.name}`)
  return NextResponse.json({ success: true })
}
