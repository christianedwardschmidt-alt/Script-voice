import { NextRequest, NextResponse } from 'next/server'
import { db, toRow } from '@/lib/db'
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM posts WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])

  if (body.liked !== undefined) {
    next.liked = body.liked ? 1 : 0
    next.likes = (next.likes as number) + (body.liked ? 1 : -1)
  }
  if (body.saved !== undefined) next.saved = body.saved ? 1 : 0
  if (body.reposted !== undefined) {
    next.reposted = body.reposted ? 1 : 0
    next.shares = (next.shares as number) + (body.reposted ? 1 : -1)
  }

  await db.execute({
    sql: `UPDATE posts SET liked=?, likes=?, saved=?, reposted=?, shares=? WHERE id=? AND user_id=?`,
    args: [next.liked, next.likes, next.saved, next.reposted, next.shares, id, user.id],
  })

  const row = await db.execute({ sql: `SELECT * FROM posts WHERE id = ?`, args: [id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}
