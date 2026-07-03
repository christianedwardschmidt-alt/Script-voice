import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

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
  const rows = db.prepare(`SELECT * FROM posts ORDER BY id DESC`).all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(deserialize))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content } = body
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const result = db
    .prepare(
      `INSERT INTO posts (author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL, 0, 0, 0, 0, 0, 0, 0, ?)`
    )
    .run('Christian Schmidt', '@christians', 'Full Stack Developer & UI Designer', '👨🏻‍💻', '#4347a8', 'now', content, new Date().toISOString())

  logActivity('Shared a new post to the community')
  const row = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>
  return NextResponse.json(deserialize(row), { status: 201 })
}
