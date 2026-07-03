import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

export async function GET() {
  const row = await queryOne(`SELECT * FROM profile WHERE id = 1`)
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest) {
  const existing = await queryOne(`SELECT * FROM profile WHERE id = 1`)
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['displayName', 'email', 'headline', 'skills']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  await execute(`UPDATE profile SET displayName=?, email=?, headline=?, skills=? WHERE id=1`, [
    next.displayName, next.email, next.headline, next.skills
  ])

  const row = await queryOne(`SELECT * FROM profile WHERE id = 1`)
  return NextResponse.json(row)
}
