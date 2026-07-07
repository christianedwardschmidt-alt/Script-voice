import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows).map(deserialize))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, priority, status, dueDate, project, integrations, checked } = body

  const res = await db.execute({
    sql: `INSERT INTO tasks (user_id, title, description, priority, status, dueDate, project, integrations, checked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [user.id, title, description ?? '', priority ?? 'medium', status ?? 'todo', dueDate ?? '', project ?? '', JSON.stringify(integrations ?? []), checked ? 1 : 0],
  })

  await logActivity(user.id, `Created new task: ${title}`)
  const row = await db.execute({ sql: `SELECT * FROM tasks WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(deserialize(toRow(row.rows[0])), { status: 201 })
}
