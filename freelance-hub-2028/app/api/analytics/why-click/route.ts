import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { actionType } = await request.json()
  if (!actionType) return NextResponse.json({ error: 'actionType required' }, { status: 400 })
  await execute(
    `INSERT INTO why_click_analytics (user_id, action_type, created_at) VALUES (?,?,?)`,
    [user.id, String(actionType), new Date().toISOString()]
  )
  return NextResponse.json({ success: true })
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll<{ action_type: string; count: number }>(
    `SELECT action_type, COUNT(*) as count FROM why_click_analytics GROUP BY action_type ORDER BY count DESC`
  )
  return NextResponse.json(rows)
}
