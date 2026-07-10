import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'christianedwardschmidt@gmail.com'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const user = await getUser()

  let sql = `
    SELECT p.*,
      ${user ? `CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END AS bookmarked,` : '0 AS bookmarked,'}
      ${user ? `COALESCE(rp.progress, 0) AS reading_progress` : '0 AS reading_progress'}
    FROM blog_posts p
    ${user ? `LEFT JOIN blog_bookmarks b ON b.post_id = p.id AND b.user_id = ?` : ''}
    ${user ? `LEFT JOIN blog_reading_progress rp ON rp.post_id = p.id AND rp.user_id = ?` : ''}
    WHERE p.status = 'published'
    ${category && category !== 'All' ? `AND p.category = ?` : ''}
    ORDER BY p.featured DESC, p.publish_date DESC
  `

  const args: (string | number)[] = []
  if (user) { args.push(user.id, user.id) }
  if (category && category !== 'All') args.push(category)

  const posts = await queryAll(sql, args)
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, slug, category, excerpt, content, featured, status, publish_date, meta_title, meta_description, read_time } = body

  const result = await execute(
    `INSERT INTO blog_posts (title, slug, category, excerpt, content, featured, status, publish_date, meta_title, meta_description, read_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [title, slug, category ?? 'General', excerpt ?? '', content ?? '', featured ? 1 : 0, status ?? 'draft', publish_date ?? null, meta_title ?? title, meta_description ?? excerpt ?? '', read_time ?? 5]
  )
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
