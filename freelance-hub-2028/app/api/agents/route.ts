import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { computeNextRunAtForAgent } from '@/lib/agentScheduler'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    trigger_config: row.trigger_config ? JSON.parse(row.trigger_config as string) : {},
    conditions: row.conditions ? JSON.parse(row.conditions as string) : [],
    actions: row.actions ? JSON.parse(row.actions as string) : [],
    recurring_config: row.recurring_config ? JSON.parse(row.recurring_config as string) : null,
    calendar_trigger_config: row.calendar_trigger_config ? JSON.parse(row.calendar_trigger_config as string) : null,
    run_count: Number(row.run_count ?? 0),
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(
    `SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  )
  return NextResponse.json(rows.map(r => deserialize(r as Record<string, unknown>)))
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const {
    name, icon, description, status, trigger_type, trigger_config, conditions, actions, template_id, marketplace_agent_id, cloned_at,
    schedule_type, scheduled_at, recurring_config, calendar_trigger_config, smart_schedule_description, suggestion_id,
  } = body
  const now = new Date().toISOString()

  const nextRunAt = await computeNextRunAtForAgent(user.id, {
    schedule_type: schedule_type ?? null,
    scheduled_at: scheduled_at ?? null,
    recurring_config: recurring_config ? JSON.stringify(recurring_config) : null,
    calendar_trigger_config: calendar_trigger_config ? JSON.stringify(calendar_trigger_config) : null,
  })

  const result = await execute(
    `INSERT INTO agents (user_id,name,icon,description,status,trigger_type,trigger_config,conditions,actions,template_id,run_count,marketplace_agent_id,cloned_at,schedule_type,scheduled_at,recurring_config,calendar_trigger_config,smart_schedule_description,next_run_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,?)`,
    [
      user.id, name ?? '', icon ?? '🤖', description ?? '', status ?? 'active', trigger_type ?? '', JSON.stringify(trigger_config ?? {}), JSON.stringify(conditions ?? []), JSON.stringify(actions ?? []), template_id ?? '', marketplace_agent_id ?? null, cloned_at ?? null,
      schedule_type ?? null, scheduled_at ?? null, recurring_config ? JSON.stringify(recurring_config) : null, calendar_trigger_config ? JSON.stringify(calendar_trigger_config) : null, smart_schedule_description ?? null, nextRunAt,
      now, now,
    ]
  )
  if (suggestion_id) {
    await execute(
      `UPDATE agent_suggestions SET accepted = 1, created_agent_id = ? WHERE id = ? AND user_id = ?`,
      [result.lastInsertRowid, suggestion_id, user.id]
    )
  }

  const rows = await queryAll(`SELECT * FROM agents WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>), { status: 201 })
}
