import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity, ensureUserCatalog } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    image: row.image ? JSON.parse(row.image as string) : null,
    trending: !!row.trending,
    liked: !!row.liked,
    saved: !!row.saved,
    reposted: !!row.reposted,
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  await ensureUserCatalog(user.id)
  const rows = await queryAll(`SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { content } = body
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const profile = await queryOne(`SELECT displayName, headline FROM profile WHERE user_id = ?`, [user.id])
  const p = profile as Record<string, unknown> | null
  const displayName = (p?.displayName as string) || user.name
  const headline = (p?.headline as string) || 'Freelancer'

  const result = await execute(
    `INSERT INTO posts (user_id, author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, 0, 0, 0, 0, 0, 0, 0, ?)`,
    [user.id, displayName, `@${user.email.split('@')[0]}`, headline, '👤', '#16a34a', 'now', content, new Date().toISOString()]
  )

  logActivity(user.id, 'Shared a new post to the community')
  const row = await queryOne(`SELECT * FROM posts WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(row!), { status: 201 })
}
