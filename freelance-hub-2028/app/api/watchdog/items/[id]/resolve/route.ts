import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const item = await queryOne<{ id: number; watchdog_run_id: number; resolved: number }>(
    `SELECT id, watchdog_run_id, resolved FROM watchdog_items WHERE id = ? AND user_id = ?`, [id, user.id]
  )
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date().toISOString()
  if (!item.resolved) {
    await execute(`UPDATE watchdog_items SET resolved = 1, resolved_at = ? WHERE id = ?`, [now, id])
    await execute(`UPDATE watchdog_runs SET items_resolved = items_resolved + 1 WHERE id = ?`, [item.watchdog_run_id])
  }

  return NextResponse.json({ ok: true })
}
