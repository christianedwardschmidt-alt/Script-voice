import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM contact_info WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ?? {})
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await queryOne(`SELECT * FROM contact_info WHERE user_id = ?`, [user.id])
  const body = await request.json()
  const next: Record<string, unknown> = { ...(existing ?? {}), user_id: user.id }
  const fields = ['fullName', 'email', 'phone', 'website', 'location', 'timezone', 'bio']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  if (existing) {
    await execute(
      `UPDATE contact_info SET fullName=?, email=?, phone=?, website=?, location=?, timezone=?, bio=? WHERE user_id=?`,
      [next.fullName, next.email, next.phone, next.website, next.location, next.timezone, next.bio, user.id]
    )
  } else {
    await execute(
      `INSERT INTO contact_info (user_id,fullName,email,phone,website,location,timezone,bio) VALUES (?,?,?,?,?,?,?,?)`,
      [user.id, next.fullName, next.email, next.phone, next.website, next.location, next.timezone, next.bio]
    )
  }

  logActivity(user.id, 'Updated contact info')
  const row = await queryOne(`SELECT * FROM contact_info WHERE user_id = ?`, [user.id])
  return NextResponse.json(row)
}
