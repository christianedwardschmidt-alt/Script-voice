import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const row = db.prepare(`SELECT * FROM profile WHERE id = 1`).get()
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest) {
  const existing = db.prepare(`SELECT * FROM profile WHERE id = 1`).get() as Record<string, unknown>
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['displayName', 'email', 'headline', 'skills']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  db.prepare(`UPDATE profile SET displayName=?, email=?, headline=?, skills=? WHERE id=1`).run(
    next.displayName, next.email, next.headline, next.skills
  )

  const row = db.prepare(`SELECT * FROM profile WHERE id = 1`).get()
  return NextResponse.json(row)
}
