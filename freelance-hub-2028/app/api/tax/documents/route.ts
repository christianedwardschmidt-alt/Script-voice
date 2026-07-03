import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

export async function GET() {
  const rows = await queryAll(`SELECT * FROM tax_documents ORDER BY id DESC`)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, status, date, size } = body
  const result = await execute(
    `INSERT INTO tax_documents (name, status, date, size) VALUES (?, ?, ?, ?)`,
    [name, status ?? 'In Progress', date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), size ?? '—']
  )
  logActivity(`Uploaded document: ${name}`)
  const row = await queryOne(`SELECT * FROM tax_documents WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
