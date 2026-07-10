import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await queryOne(
    `SELECT * FROM news_preferences WHERE user_id = ?`,
    [user.id]
  )
  return NextResponse.json(prefs ?? { industries: '[]', topics: '[]' })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { industries, topics } = await request.json()
  await execute(
    `INSERT INTO news_preferences (user_id, industries, topics, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       industries = excluded.industries,
       topics = excluded.topics,
       updated_at = excluded.updated_at`,
    [user.id, JSON.stringify(industries ?? []), JSON.stringify(topics ?? [])]
  )
  return NextResponse.json({ ok: true })
}
