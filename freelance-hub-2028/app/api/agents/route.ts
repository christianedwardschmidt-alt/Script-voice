import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    trigger_config: row.trigger_config ? JSON.parse(row.trigger_config as string) : {},
    conditions: row.conditions ? JSON.parse(row.conditions as string) : [],
    actions: row.actions ? JSON.parse(row.actions as string) : [],
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
  const { name, icon, description, status, trigger_type, trigger_config, conditions, actions, template_id, marketplace_agent_id, cloned_at } = body
  const now = new Date().toISOString()
  const result = await execute(
    `INSERT INTO agents (user_id,name,icon,description,status,trigger_type,trigger_config,conditions,actions,template_id,run_count,marketplace_agent_id,cloned_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`,
    [user.id, name ?? '', icon ?? '🤖', description ?? '', status ?? 'active', trigger_type ?? '', JSON.stringify(trigger_config ?? {}), JSON.stringify(conditions ?? []), JSON.stringify(actions ?? []), template_id ?? '', marketplace_agent_id ?? null, cloned_at ?? null, now, now]
  )
  const rows = await queryAll(`SELECT * FROM agents WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>), { status: 201 })
}
