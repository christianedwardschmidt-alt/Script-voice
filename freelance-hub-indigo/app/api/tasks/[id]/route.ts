import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await db.execute({ sql: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(toRow(res.rows[0])))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  const fields = ['title', 'description', 'priority', 'status', 'dueDate', 'project']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]
  if (body.integrations !== undefined) next.integrations = JSON.stringify(body.integrations)
  if (body.checked !== undefined) next.checked = body.checked ? 1 : 0

  await db.execute({
    sql: `UPDATE tasks SET title=?, description=?, priority=?, status=?, dueDate=?, project=?, integrations=?, checked=? WHERE id=? AND user_id=?`,
    args: [next.title, next.description, next.priority, next.status, next.dueDate, next.project, next.integrations, next.checked, id, user.id],
  })

  if (body.checked !== undefined && !!body.checked !== !!existing.rows[0].checked) {
    await logActivity(user.id, body.checked ? `Completed task: ${next.title}` : `Reopened task: ${next.title}`)
  }

  const row = await db.execute({ sql: `SELECT * FROM tasks WHERE id = ?`, args: [id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT title FROM tasks WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute({ sql: `DELETE FROM tasks WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  await logActivity(user.id, `Deleted task: ${existing.rows[0].title}`)
  return NextResponse.json({ success: true })
}
