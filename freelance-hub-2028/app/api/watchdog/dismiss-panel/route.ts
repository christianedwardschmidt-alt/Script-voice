import { NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const run = await queryOne<{ id: number }>(`SELECT id FROM watchdog_runs WHERE user_id = ? AND run_date = ? ORDER BY id DESC LIMIT 1`, [user.id, today])
  if (run) {
    await execute(`UPDATE watchdog_runs SET panel_dismissed = 1 WHERE id = ?`, [run.id])
  }
  return NextResponse.json({ ok: true })
}
