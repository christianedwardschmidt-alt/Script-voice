import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }
}

export async function GET() {
  const rows = db.prepare(`SELECT * FROM tasks ORDER BY id DESC`).all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, priority, status, dueDate, project, integrations, checked } = body
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, priority, status, dueDate, project, integrations, checked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      description ?? '',
      priority ?? 'medium',
      status ?? 'todo',
      dueDate ?? '',
      project ?? '',
      JSON.stringify(integrations ?? []),
      checked ? 1 : 0
    )
  logActivity(`Created new task: ${title}`)
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>
  return NextResponse.json(deserialize(row), { status: 201 })
}
