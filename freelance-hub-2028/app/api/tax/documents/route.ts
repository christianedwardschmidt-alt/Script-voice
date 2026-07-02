import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET() {
  const rows = db.prepare(`SELECT * FROM tax_documents ORDER BY id DESC`).all()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, status, date, size } = body
  const result = db
    .prepare(`INSERT INTO tax_documents (name, status, date, size) VALUES (?, ?, ?, ?)`)
    .run(name, status ?? 'In Progress', date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), size ?? '—')
  logActivity(`Uploaded document: ${name}`)
  const row = db.prepare(`SELECT * FROM tax_documents WHERE id = ?`).get(result.lastInsertRowid)
  return NextResponse.json(row, { status: 201 })
}
