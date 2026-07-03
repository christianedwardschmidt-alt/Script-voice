import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM posts WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }

  if (body.liked !== undefined) {
    next.liked = body.liked ? 1 : 0
    next.likes = (existing.likes as number) + (body.liked ? 1 : -1)
  }
  if (body.saved !== undefined) next.saved = body.saved ? 1 : 0
  if (body.reposted !== undefined) {
    next.reposted = body.reposted ? 1 : 0
    next.shares = (existing.shares as number) + (body.reposted ? 1 : -1)
  }

  await execute(`UPDATE posts SET liked=?, likes=?, saved=?, reposted=?, shares=? WHERE id=?`, [
    next.liked, next.likes, next.saved, next.reposted, next.shares, id
  ])

  const row = await queryOne(`SELECT * FROM posts WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}
