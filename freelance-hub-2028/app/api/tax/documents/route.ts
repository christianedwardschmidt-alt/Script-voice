import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_documents WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { name, status, date, size } = body
  const result = await execute(
    `INSERT INTO tax_documents (user_id, name, status, date, size) VALUES (?, ?, ?, ?, ?)`,
    [user.id, name, status ?? 'In Progress', date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), size ?? '—']
  )
  logActivity(user.id, `Uploaded document: ${name}`)
  const row = await queryOne(`SELECT * FROM tax_documents WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
