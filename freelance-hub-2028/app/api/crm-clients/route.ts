import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, tags: row.tags ? JSON.parse(row.tags as string) : [], starred: !!row.starred }
}

export async function GET() {
  const rows = await queryAll(`SELECT * FROM crm_clients ORDER BY id DESC`)
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes } = body
  const result = await execute(
    `INSERT INTO crm_clients (name,company,email,phone,website,stage,value,avatar,avatarBg,tags,lastContact,starred,rating,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [name, company, email ?? null, phone ?? null, website ?? null, stage ?? 'Lead', value ?? 0, avatar ?? '👤', avatarBg ?? '#16a34a', JSON.stringify(tags ?? []), lastContact ?? 'just now', starred ? 1 : 0, rating ?? 0, notes ?? '']
  )
  logActivity(`Added new CRM lead: ${name}`)
  const row = await queryOne(`SELECT * FROM crm_clients WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(row!), { status: 201 })
}
