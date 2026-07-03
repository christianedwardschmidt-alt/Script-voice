import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET() {
  const rows = db.prepare(`SELECT * FROM tax_deductions ORDER BY id ASC`).all()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { category, amount, icon, max, color } = body
  const result = db
    .prepare(`INSERT INTO tax_deductions (category, amount, icon, max, color) VALUES (?, ?, ?, ?, ?)`)
    .run(category, amount ?? 0, icon ?? '📁', max ?? 5400, color ?? '#4347a8')
  logActivity(`Added tax deduction: ${category}`)
  const row = db.prepare(`SELECT * FROM tax_deductions WHERE id = ?`).get(result.lastInsertRowid)
  return NextResponse.json(row, { status: 201 })
}
