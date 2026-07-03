import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

export async function GET() {
  const rows = await queryAll(`SELECT * FROM clients ORDER BY id DESC`)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, company, email, phone, website, avatar, color, status, revenue, projects } = body
  const result = await execute(
    `INSERT INTO clients (name,company,email,phone,website,avatar,color,status,revenue,projects) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [name, company, email ?? null, phone ?? null, website ?? null, avatar ?? '👤', color ?? '#16a34a', status ?? 'active', revenue ?? 0, projects ?? 0]
  )
  logActivity(`Added new client: ${name}`)
  const row = await queryOne(`SELECT * FROM clients WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
