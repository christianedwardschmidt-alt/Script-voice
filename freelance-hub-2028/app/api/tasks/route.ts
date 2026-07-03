import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET() {
  const rows = await queryAll(`SELECT * FROM tasks ORDER BY id DESC`)
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, priority, status, dueDate, project, integrations, checked } = body
  const result = await execute(
    `INSERT INTO tasks (title,description,priority,status,dueDate,project,integrations,checked) VALUES (?,?,?,?,?,?,?,?)`,
    [title, description ?? '', priority ?? 'medium', status ?? 'todo', dueDate ?? '', project ?? '', JSON.stringify(integrations ?? []), checked ? 1 : 0]
  )
  logActivity(`Created new task: ${title}`)
  const rows = await queryAll(`SELECT * FROM tasks WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(rows[0]), { status: 201 })
}
