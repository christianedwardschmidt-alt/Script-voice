import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

export async function GET() {
  const rows = await queryAll(`SELECT * FROM tax_deductions ORDER BY id ASC`)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { category, amount, icon, max, color } = body
  const result = await execute(
    `INSERT INTO tax_deductions (category, amount, icon, max, color) VALUES (?, ?, ?, ?, ?)`,
    [category, amount ?? 0, icon ?? '📁', max ?? 5400, color ?? '#16a34a']
  )
  logActivity(`Added tax deduction: ${category}`)
  const row = await queryOne(`SELECT * FROM tax_deductions WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
