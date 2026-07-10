import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'christianedwardschmidt@gmail.com'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()

  // Support lookup by slug or numeric id
  const isNumeric = /^\d+$/.test(id)
  const whereClause = isNumeric ? 'p.id = ?' : 'p.slug = ?'

  const sql = `
    SELECT p.*,
      ${user ? `CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END AS bookmarked,` : '0 AS bookmarked,'}
      ${user ? `COALESCE(rp.progress, 0) AS reading_progress` : '0 AS reading_progress'}
    FROM blog_posts p
    ${user ? `LEFT JOIN blog_bookmarks b ON b.post_id = p.id AND b.user_id = ?` : ''}
    ${user ? `LEFT JOIN blog_reading_progress rp ON rp.post_id = p.id AND rp.user_id = ?` : ''}
    WHERE ${whereClause}
  `

  const args: (string | number)[] = []
  if (user) { args.push(user.id, user.id) }
  args.push(isNumeric ? parseInt(id) : id)

  const post = await queryOne(sql, args)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const allowed = ['title', 'slug', 'category', 'excerpt', 'content', 'featured', 'status', 'publish_date', 'meta_title', 'meta_description', 'read_time']
  const updates = Object.entries(body).filter(([k]) => allowed.includes(k))
  if (!updates.length) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values = updates.map(([, v]) => v as any)

  await execute(
    `UPDATE blog_posts SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
    [...values, parseInt(id)]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await execute(`DELETE FROM blog_posts WHERE id = ?`, [parseInt(id)])
  return NextResponse.json({ ok: true })
}
