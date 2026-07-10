import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM profile WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ?? { displayName: user.name, email: user.email, headline: '', skills: '', years_experience: 0 })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await queryOne(`SELECT * FROM profile WHERE user_id = ?`, [user.id])
  const body = await request.json()
  const next: Record<string, unknown> = { ...(existing ?? { displayName: user.name, email: user.email, headline: '', skills: '', years_experience: 0 }) }
  const fields = ['displayName', 'email', 'headline', 'skills', 'years_experience']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f]

  if (existing) {
    await execute(`UPDATE profile SET displayName=?, email=?, headline=?, skills=?, years_experience=? WHERE user_id=?`,
      [next.displayName, next.email, next.headline, next.skills, Number(next.years_experience) || 0, user.id] as (string | number)[])
  } else {
    await execute(`INSERT INTO profile (user_id,displayName,email,headline,skills,years_experience) VALUES (?,?,?,?,?,?)`,
      [user.id, next.displayName, next.email, next.headline, next.skills, Number(next.years_experience) || 0] as (string | number)[])
  }

  const row = await queryOne(`SELECT * FROM profile WHERE user_id = ?`, [user.id])
  return NextResponse.json(row)
}
