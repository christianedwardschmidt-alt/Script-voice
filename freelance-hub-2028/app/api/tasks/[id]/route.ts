import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await queryOne(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(row))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM tasks WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  for (const f of ['title','description','priority','status','dueDate','project']) {
    if (body[f] !== undefined) next[f] = body[f]
  }
  if (body.integrations !== undefined) next.integrations = JSON.stringify(body.integrations)
  if (body.checked !== undefined) next.checked = body.checked ? 1 : 0

  await execute(
    `UPDATE tasks SET title=?,description=?,priority=?,status=?,dueDate=?,project=?,integrations=?,checked=? WHERE id=?`,
    [next.title, next.description, next.priority, next.status, next.dueDate, next.project, next.integrations, next.checked, id]
  )

  if (body.checked !== undefined && !!body.checked !== !!existing.checked) {
    logActivity(body.checked ? `Completed task: ${next.title}` : `Reopened task: ${next.title}`)
  }

  const row = await queryOne(`SELECT * FROM tasks WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne<{ title: string }>(`SELECT title FROM tasks WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM tasks WHERE id = ?`, [id])
  logActivity(`Deleted task: ${existing.title}`)
  return NextResponse.json({ success: true })
}
