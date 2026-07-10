import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  let sql: string
  let args: (string | number)[]

  if (category && category !== 'All') {
    sql = `SELECT a.*,
             CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as bookmarked
           FROM news_articles a
           LEFT JOIN news_bookmarks b ON b.article_id = a.id AND b.user_id = ?
           WHERE a.category = ?
           ORDER BY a.published_at DESC`
    args = [user.id, category]
  } else {
    sql = `SELECT a.*,
             CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as bookmarked
           FROM news_articles a
           LEFT JOIN news_bookmarks b ON b.article_id = a.id AND b.user_id = ?
           ORDER BY a.published_at DESC`
    args = [user.id]
  }

  const articles = await queryAll(sql, args)
  return NextResponse.json(articles)
}
