import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll<Record<string, unknown>>(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30`, [user.id])
  const unread = await queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read = 0`, [user.id])
  const parsed = rows.map(r => ({ ...r, meta: JSON.parse((r.meta as string) || '{}'), read: !!r.read }))
  return NextResponse.json({ notifications: parsed, unread: unread?.cnt ?? 0 })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (body.markAllRead) {
    await execute(`UPDATE notifications SET read = 1 WHERE user_id = ?`, [user.id])
    return NextResponse.json({ success: true })
  }
  if (body.id) {
    await execute(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`, [body.id, user.id])
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })
}
