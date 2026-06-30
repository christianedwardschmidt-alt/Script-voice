import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET() {
  const row = db.prepare(`SELECT * FROM contact_info WHERE id = 1`).get()
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest) {
  const existing = db.prepare(`SELECT * FROM contact_info WHERE id = 1`).get() as Record<string, unknown>
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['fullName', 'email', 'phone', 'website', 'location', 'timezone', 'bio']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  db.prepare(
    `UPDATE contact_info SET fullName=?, email=?, phone=?, website=?, location=?, timezone=?, bio=? WHERE id=1`
  ).run(next.fullName, next.email, next.phone, next.website, next.location, next.timezone, next.bio)

  logActivity('Updated contact info')
  const row = db.prepare(`SELECT * FROM contact_info WHERE id = 1`).get()
  return NextResponse.json(row)
}
