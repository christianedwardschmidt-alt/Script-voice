import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ progress: 0 })

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const row = await queryOne<{ progress: number }>(
    `SELECT progress FROM blog_reading_progress WHERE user_id = ? AND post_id = ?`,
    [user.id, parseInt(postId)]
  )
  return NextResponse.json({ progress: row?.progress ?? 0 })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ ok: true })

  const { postId, progress } = await req.json()
  await execute(
    `INSERT INTO blog_reading_progress (user_id, post_id, progress, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, post_id) DO UPDATE SET progress = excluded.progress, updated_at = excluded.updated_at`,
    [user.id, postId, progress]
  )
  return NextResponse.json({ ok: true })
}
