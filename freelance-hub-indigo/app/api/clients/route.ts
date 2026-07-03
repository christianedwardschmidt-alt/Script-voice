import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET() {
  const rows = db.prepare(`SELECT * FROM clients ORDER BY id DESC`).all()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, company, email, phone, website, avatar, color, status, revenue, projects } = body
  const result = db
    .prepare(
      `INSERT INTO clients (name, company, email, phone, website, avatar, color, status, revenue, projects)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      company,
      email ?? null,
      phone ?? null,
      website ?? null,
      avatar ?? '👤',
      color ?? '#4347a8',
      status ?? 'active',
      revenue ?? 0,
      projects ?? 0
    )
  logActivity(`Added new client: ${name}`)
  const row = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(result.lastInsertRowid)
  return NextResponse.json(row, { status: 201 })
}
