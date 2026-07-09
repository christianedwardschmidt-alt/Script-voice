import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    pinned: !!row.pinned,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(
    `SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, updated_at DESC`,
    [user.id]
  )
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, content, pinned, linked_client, tags } = body
  const now = new Date().toISOString()
  const result = await execute(
    `INSERT INTO notes (user_id, title, content, pinned, linked_client, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, title ?? '', content ?? '', pinned ? 1 : 0, linked_client ?? '', JSON.stringify(tags ?? []), now, now]
  )
  const rows = await queryAll(`SELECT * FROM notes WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>), { status: 201 })
}
