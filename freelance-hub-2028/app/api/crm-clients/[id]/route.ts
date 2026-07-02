import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    starred: !!row.starred,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = db.prepare(`SELECT * FROM crm_clients WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(row))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM crm_clients WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['name', 'company', 'email', 'phone', 'website', 'stage', 'value', 'avatar', 'avatarBg', 'lastContact', 'rating', 'notes']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]
  if (body.tags !== undefined) next.tags = JSON.stringify(body.tags)
  if (body.starred !== undefined) next.starred = body.starred ? 1 : 0

  db.prepare(
    `UPDATE crm_clients SET name=?, company=?, email=?, phone=?, website=?, stage=?, value=?, avatar=?, avatarBg=?, tags=?, lastContact=?, starred=?, rating=?, notes=? WHERE id=?`
  ).run(
    next.name, next.company, next.email, next.phone, next.website, next.stage, next.value,
    next.avatar, next.avatarBg, next.tags, next.lastContact, next.starred, next.rating, next.notes, id
  )

  if (body.stage !== undefined && body.stage !== existing.stage) {
    logActivity(`Moved ${existing.name} to ${body.stage} stage`)
  }

  const row = db.prepare(`SELECT * FROM crm_clients WHERE id = ?`).get(id) as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM crm_clients WHERE id = ?`).get(id) as { name: string } | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  db.prepare(`DELETE FROM crm_clients WHERE id = ?`).run(id)
  logActivity(`Removed CRM lead: ${existing.name}`)
  return NextResponse.json({ success: true })
}
