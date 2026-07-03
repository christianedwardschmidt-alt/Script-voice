import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

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
  const rows = await queryAll(`SELECT * FROM posts ORDER BY id DESC`)
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content } = body
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const result = await execute(
    `INSERT INTO posts (author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL, 0, 0, 0, 0, 0, 0, 0, ?)`,
    ['Christian Schmidt', '@christians', 'Full Stack Developer & UI Designer', '👨🏻‍💻', '#16a34a', 'now', content, new Date().toISOString()]
  )

  logActivity('Shared a new post to the community')
  const row = await queryOne(`SELECT * FROM posts WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(row!), { status: 201 })
}
