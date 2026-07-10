import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { valid_until } = body

  await execute(
    `UPDATE proposals SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now')
     ${valid_until ? ", valid_until = ?" : ""}
     WHERE id = ? AND user_id = ?`,
    valid_until ? [valid_until, id, user.id] : [id, user.id]
  )
  const rows = await queryAll(`SELECT * FROM proposals WHERE id = ?`, [id])
  return NextResponse.json(rows[0])
}
