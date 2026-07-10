import { NextResponse } from 'next/server'
import { queryOne, queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface RunRow {
  id: number
  run_date: string
  items_generated: number
  items_shown: number
  items_resolved: number
  items_dismissed: number
  panel_dismissed: number
}

interface ItemRow {
  id: number
  category: string
  priority_score: number
  priority_color: string
  alert_text: string
  action_type: string
  action_data: string
  resolved: number
  dismissed: number
  resolved_at: string | null
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const run = await queryOne<RunRow>(
    `SELECT id, run_date, items_generated, items_shown, items_resolved, items_dismissed, panel_dismissed FROM watchdog_runs WHERE user_id = ? AND run_date = ? ORDER BY id DESC LIMIT 1`,
    [user.id, today]
  )
  if (!run) return NextResponse.json({ run: null, items: [] })

  const items = await queryAll<ItemRow>(
    `SELECT id, category, priority_score, priority_color, alert_text, action_type, action_data, resolved, dismissed, resolved_at FROM watchdog_items WHERE watchdog_run_id = ? ORDER BY priority_score DESC`,
    [run.id]
  )

  return NextResponse.json({
    run,
    items: items.map(i => ({ ...i, action_data: JSON.parse(i.action_data || '{}') })),
  })
}
