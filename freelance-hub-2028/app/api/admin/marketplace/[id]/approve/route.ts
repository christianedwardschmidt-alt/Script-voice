import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser, isAdmin } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const submission = await queryOne<{ id: number; name: string; submitted_by_user_id: number | null }>(
    `SELECT id, name, submitted_by_user_id FROM marketplace_agents WHERE id = ? AND approved = 0`,
    [id]
  )
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date().toISOString()
  await execute(`UPDATE marketplace_agents SET approved = 1, approved_at = ? WHERE id = ?`, [now, submission.id])

  if (submission.submitted_by_user_id) {
    await execute(
      `INSERT INTO notifications (user_id,type,title,body,href,created_at) VALUES (?,?,?,?,?,?)`,
      [
        submission.submitted_by_user_id,
        'marketplace_approved',
        'Your agent is live in the Marketplace',
        `"${submission.name}" was approved and is now live for the whole guild to clone. Thank you for contributing.`,
        '/agents',
        now,
      ]
    )
  }

  return NextResponse.json({ ok: true })
}
