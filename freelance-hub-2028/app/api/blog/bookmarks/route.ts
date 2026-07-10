import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await queryAll(
    `SELECT p.*, 1 AS bookmarked
     FROM blog_bookmarks bk
     JOIN blog_posts p ON p.id = bk.post_id
     WHERE bk.user_id = ?
     ORDER BY bk.id DESC`,
    [user.id]
  )
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await req.json()
  await execute(
    `INSERT OR IGNORE INTO blog_bookmarks (user_id, post_id) VALUES (?, ?)`,
    [user.id, postId]
  )
  return NextResponse.json({ ok: true })
}
