import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const articles = await queryAll(
    `SELECT a.*, b.id as bookmark_id, 1 as bookmarked
     FROM news_bookmarks b
     JOIN news_articles a ON a.id = b.article_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [user.id]
  )
  return NextResponse.json(articles)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { article_id } = await request.json()
  const result = await execute(
    `INSERT OR IGNORE INTO news_bookmarks (user_id, article_id) VALUES (?, ?)`,
    [user.id, article_id]
  )
  return NextResponse.json({ ok: true, id: result.lastInsertRowid })
}
