import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface RunRow {
  id: number
  run_date: string
  items_generated: number
  items_shown: number
  items_resolved: number
  items_dismissed: number
}

interface ItemRow {
  id: number
  watchdog_run_id: number
  category: string
  priority_color: string
  alert_text: string
  action_type: string
  resolved: number
  dismissed: number
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const runs = await queryAll<RunRow>(
    `SELECT id, run_date, items_generated, items_shown, items_resolved, items_dismissed FROM watchdog_runs WHERE user_id = ? AND run_date >= ? ORDER BY run_date DESC`,
    [user.id, cutoff]
  )
  if (runs.length === 0) return NextResponse.json({ runs: [] })

  const runIds = runs.map(r => r.id)
  const placeholders = runIds.map(() => '?').join(',')
  const items = await queryAll<ItemRow>(
    `SELECT id, watchdog_run_id, category, priority_color, alert_text, action_type, resolved, dismissed FROM watchdog_items WHERE watchdog_run_id IN (${placeholders}) ORDER BY id ASC`,
    runIds
  )

  const itemsByRun = new Map<number, ItemRow[]>()
  for (const item of items) {
    if (!itemsByRun.has(item.watchdog_run_id)) itemsByRun.set(item.watchdog_run_id, [])
    itemsByRun.get(item.watchdog_run_id)!.push(item)
  }

  return NextResponse.json({
    runs: runs.map(r => ({ ...r, items: itemsByRun.get(r.id) || [] })),
  })
}
