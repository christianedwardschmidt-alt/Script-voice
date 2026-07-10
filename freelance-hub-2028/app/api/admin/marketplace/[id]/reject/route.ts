import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser, isAdmin } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { reason } = await req.json()

  const submission = await queryOne<{ id: number; name: string; submitted_by_user_id: number | null }>(
    `SELECT id, name, submitted_by_user_id FROM marketplace_agents WHERE id = ? AND approved = 0`,
    [id]
  )
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date().toISOString()
  if (submission.submitted_by_user_id) {
    await execute(
      `INSERT INTO notifications (user_id,type,title,body,href,created_at) VALUES (?,?,?,?,?,?)`,
      [
        submission.submitted_by_user_id,
        'marketplace_rejected',
        'Your marketplace submission needs changes',
        `"${submission.name}" wasn't approved this time.${reason ? ` Reason: ${reason}` : ''}`,
        '/agents',
        now,
      ]
    )
  }

  await execute(`DELETE FROM marketplace_agents WHERE id = ?`, [submission.id])

  return NextResponse.json({ ok: true })
}
