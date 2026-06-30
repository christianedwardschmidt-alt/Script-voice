import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(row))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['title', 'description', 'priority', 'status', 'dueDate', 'project']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]
  if (body.integrations !== undefined) next.integrations = JSON.stringify(body.integrations)
  if (body.checked !== undefined) next.checked = body.checked ? 1 : 0

  db.prepare(
    `UPDATE tasks SET title=?, description=?, priority=?, status=?, dueDate=?, project=?, integrations=?, checked=? WHERE id=?`
  ).run(next.title, next.description, next.priority, next.status, next.dueDate, next.project, next.integrations, next.checked, id)

  if (body.checked !== undefined && !!body.checked !== !!existing.checked) {
    logActivity(body.checked ? `Completed task: ${next.title}` : `Reopened task: ${next.title}`)
  }

  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as { title: string } | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
  logActivity(`Deleted task: ${existing.title}`)
  return NextResponse.json({ success: true })
}
