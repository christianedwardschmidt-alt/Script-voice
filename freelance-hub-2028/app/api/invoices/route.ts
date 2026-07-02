import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET() {
  const rows = db.prepare(`SELECT * FROM invoices ORDER BY id DESC`).all()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { client, project, amount, status, issued, due, avatar, color } = body

  const last = db.prepare(`SELECT id FROM invoices ORDER BY id DESC LIMIT 1`).get() as { id: string } | undefined
  let nextNum = 92
  if (last?.id) {
    const m = last.id.match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  const id = `INV-${String(nextNum).padStart(3, '0')}`

  db.prepare(
    `INSERT INTO invoices (id, client, project, amount, status, issued, due, avatar, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, client, project ?? '', amount ?? 0, status ?? 'Draft', issued ?? '', due ?? '', avatar ?? '👤', color ?? '#16a34a')

  logActivity(`Created invoice ${id} for ${client}`)
  const row = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id)
  return NextResponse.json(row, { status: 201 })
}
