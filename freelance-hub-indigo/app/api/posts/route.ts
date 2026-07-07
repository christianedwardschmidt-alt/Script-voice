import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows).map(deserialize))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { content } = body
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const profileRes = await db.execute({ sql: `SELECT displayName, headline FROM profile WHERE user_id = ?`, args: [user.id] })
  const profile = profileRes.rows[0] ? toRow(profileRes.rows[0]) : null

  const res = await db.execute({
    sql: `INSERT INTO posts (user_id, author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt) VALUES (?, ?, ?, ?, ?, ?, 'now', 0, ?, NULL, 0, 0, 0, 0, 0, 0, 0, ?)`,
    args: [user.id, profile?.displayName ?? user.name, `@${user.name.toLowerCase().replace(/\s+/g, '')}`, profile?.headline ?? 'Freelancer', '👨🏻‍💻', '#15803d', content, new Date().toISOString()],
  })

  await logActivity(user.id, 'Shared a new post to the community')
  const row = await db.execute({ sql: `SELECT * FROM posts WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(deserialize(toRow(row.rows[0])), { status: 201 })
}
