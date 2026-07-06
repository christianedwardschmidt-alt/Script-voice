import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute, logActivity } from '@/lib/db'
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
  const rows = await queryAll(`SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { title, description, priority, status, dueDate, project, integrations, checked } = body
  const result = await execute(
    `INSERT INTO tasks (user_id,title,description,priority,status,dueDate,project,integrations,checked) VALUES (?,?,?,?,?,?,?,?,?)`,
    [user.id, title, description ?? '', priority ?? 'medium', status ?? 'todo', dueDate ?? '', project ?? '', JSON.stringify(integrations ?? []), checked ? 1 : 0]
  )
  logActivity(user.id, `Created new task: ${title}`)
  const rows = await queryAll(`SELECT * FROM tasks WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(rows[0]), { status: 201 })
}
