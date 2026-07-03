import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function GET() {
  const row = await queryOne(`SELECT * FROM contact_info WHERE id = 1`)
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest) {
  const existing = await queryOne(`SELECT * FROM contact_info WHERE id = 1`)
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['fullName', 'email', 'phone', 'website', 'location', 'timezone', 'bio']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await execute(
    `UPDATE contact_info SET fullName=?, email=?, phone=?, website=?, location=?, timezone=?, bio=? WHERE id=1`,
    [next.fullName, next.email, next.phone, next.website, next.location, next.timezone, next.bio]
  )

  logActivity('Updated contact info')
  const row = await queryOne(`SELECT * FROM contact_info WHERE id = 1`)
  return NextResponse.json(row)
}
