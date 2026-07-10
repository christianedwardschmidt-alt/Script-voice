import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const rows = await queryAll(
    `SELECT p.*, u.name as owner_name FROM proposals p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.share_token = ?`,
    [token]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json()
  const { action, signature, time_spent } = body

  const rows = await queryAll(`SELECT * FROM proposals WHERE share_token = ?`, [token])
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const proposal = rows[0] as { id: number; user_id: number; status: string }

  if (action === 'view') {
    const isFirstView = proposal.status === 'sent'
    await execute(
      `UPDATE proposals SET view_count = view_count + 1, last_viewed_at = datetime('now'),
       status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
       updated_at = datetime('now') WHERE share_token = ?`,
      [token]
    )
    await execute(
      `INSERT INTO proposal_views (proposal_id, user_id, viewed_at, time_spent) VALUES (?,?,datetime('now'),?)`,
      [proposal.id, proposal.user_id, time_spent || 0]
    )
    return NextResponse.json({ ok: true, statusChanged: isFirstView })
  }

  if (action === 'accept') {
    await execute(
      `UPDATE proposals SET status = 'accepted', accepted_at = datetime('now'),
       accepted_by = ?, updated_at = datetime('now') WHERE share_token = ?`,
      [signature || '', token]
    )
    return NextResponse.json({ ok: true })
  }

  if (action === 'decline') {
    await execute(
      `UPDATE proposals SET status = 'declined', declined_at = datetime('now'),
       updated_at = datetime('now') WHERE share_token = ?`,
      [token]
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
