import { queryAll, queryOne, execute } from '@/lib/db'
import { notify } from '@/lib/notify'
import { simulateAgentRun, pruneAgentRuns, type SimAgent } from '@/lib/agentRun'
import { computeRecurringNextRun, applyCalendarOffset, type RecurringConfig, type CalendarTriggerConfig } from '@/lib/scheduling'

export interface ScheduleFields {
  schedule_type: string | null
  scheduled_at: string | null
  recurring_config: string | null
  calendar_trigger_config: string | null
}

interface CalendarEventRow {
  id: number
  title: string
  date: string
  startTime: string | null
  type: string
  client: string | null
}

async function nextMatchingCalendarEvent(userId: number, cfg: CalendarTriggerConfig): Promise<CalendarEventRow | null> {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await queryAll<CalendarEventRow>(
    `SELECT id, title, date, startTime, type, client FROM calendar_events WHERE user_id = ? AND date >= ? ORDER BY date ASC, startTime ASC`,
    [userId, today]
  )
  const now = Date.now()
  for (const row of rows) {
    if (cfg.eventFilter === 'meetings' && row.type !== 'meeting') continue
    if (cfg.eventFilter === 'deadlines' && row.type !== 'deadline') continue
    if (cfg.eventFilter === 'client' && cfg.clientName && row.client !== cfg.clientName) continue
    const eventIso = `${row.date}T${row.startTime || '09:00'}:00`
    const fireIso = applyCalendarOffset(eventIso, cfg)
    if (new Date(fireIso).getTime() > now) return row
  }
  return null
}

export async function computeNextRunAtForAgent(userId: number, fields: ScheduleFields, from: Date = new Date()): Promise<string | null> {
  switch (fields.schedule_type) {
    case 'once': {
      if (!fields.scheduled_at) return null
      return new Date(fields.scheduled_at).getTime() > from.getTime() ? fields.scheduled_at : null
    }
    case 'recurring':
    case 'smart': {
      if (!fields.recurring_config) return null
      const cfg = JSON.parse(fields.recurring_config) as RecurringConfig
      return computeRecurringNextRun(cfg, from)
    }
    case 'calendar': {
      if (!fields.calendar_trigger_config) return null
      const cfg = JSON.parse(fields.calendar_trigger_config) as CalendarTriggerConfig
      const event = await nextMatchingCalendarEvent(userId, cfg)
      if (!event) return null
      const eventIso = `${event.date}T${event.startTime || '09:00'}:00`
      return applyCalendarOffset(eventIso, cfg)
    }
    default:
      return null
  }
}

interface DueAgentRow {
  id: number
  user_id: number
  name: string
  template_id: string
  trigger_type: string
  actions: string
  schedule_type: string | null
  scheduled_at: string | null
  recurring_config: string | null
  calendar_trigger_config: string | null
  next_run_at: string
}

export async function runDueAgents(now: Date = new Date()): Promise<{ fired: number; results: { agentId: number; name: string; status: string; nextRunAt: string | null }[] }> {
  const nowIso = now.toISOString()
  const due = await queryAll<DueAgentRow>(
    `SELECT id, user_id, name, template_id, trigger_type, actions, schedule_type, scheduled_at, recurring_config, calendar_trigger_config, next_run_at
     FROM agents WHERE status = 'active' AND next_run_at IS NOT NULL AND next_run_at <= ?`,
    [nowIso]
  )

  const results: { agentId: number; name: string; status: string; nextRunAt: string | null }[] = []

  for (const agent of due) {
    const scheduledFor = agent.next_run_at
    const triggerLabel = agent.schedule_type === 'calendar' ? 'Calendar trigger fired' : 'Scheduled run'

    const runResult = await execute(
      `INSERT INTO agent_runs (agent_id,user_id,status,trigger_event,action_taken,ran_at) VALUES (?,?,?,?,?,?)`,
      [agent.id, agent.user_id, 'running', triggerLabel, '', nowIso]
    )
    const runId = Number(runResult.lastInsertRowid)

    const simAgent: SimAgent = {
      id: agent.id,
      name: agent.name,
      template_id: agent.template_id,
      trigger_type: agent.trigger_type,
      actions: agent.actions ? JSON.parse(agent.actions) : [],
    }
    const outcome = await simulateAgentRun(simAgent, agent.user_id, triggerLabel, runId)
    const completedAt = new Date().toISOString()

    await execute(
      `UPDATE agent_runs SET status = ?, action_taken = ?, technical_log = ?, branch_taken = ?, ran_at = ? WHERE id = ?`,
      [outcome.status, outcome.actionTaken, JSON.stringify(outcome.technicalLog), outcome.branchTaken ?? null, completedAt, runId]
    )

    const nextRunAt = await computeNextRunAtForAgent(agent.user_id, {
      schedule_type: agent.schedule_type,
      scheduled_at: agent.schedule_type === 'once' ? null : agent.scheduled_at, // a fired "once" agent has no further runs
      recurring_config: agent.recurring_config,
      calendar_trigger_config: agent.calendar_trigger_config,
    }, now)

    await execute(
      `UPDATE agents SET run_count = run_count + 1, last_run = ?, next_run_at = ?, updated_at = ? WHERE id = ?`,
      [completedAt, nextRunAt, completedAt, agent.id]
    )

    await execute(
      `INSERT INTO agent_schedule_log (agent_id, scheduled_for, ran_at, status, created_at) VALUES (?,?,?,?,?)`,
      [agent.id, scheduledFor, completedAt, 'fired', completedAt]
    )

    await notify({
      userId: agent.user_id,
      type: 'agent_scheduled_run',
      title: `${agent.name} ran on schedule`,
      body: outcome.actionTaken,
      href: `/agents/${agent.id}`,
    })

    await pruneAgentRuns(agent.id)
    results.push({ agentId: agent.id, name: agent.name, status: outcome.status, nextRunAt })
  }

  return { fired: results.length, results }
}

export async function upcomingRunsForAgent(agentId: number, count = 5): Promise<{ scheduled_for: string }[]> {
  const agent = await queryOne<{ next_run_at: string | null; schedule_type: string | null; recurring_config: string | null }>(
    `SELECT next_run_at, schedule_type, recurring_config FROM agents WHERE id = ?`, [agentId]
  )
  if (!agent?.next_run_at) return []
  if (agent.schedule_type === 'once' || agent.schedule_type === 'calendar' || !agent.recurring_config) {
    return [{ scheduled_for: agent.next_run_at }]
  }
  const cfg = JSON.parse(agent.recurring_config) as RecurringConfig
  const out: { scheduled_for: string }[] = [{ scheduled_for: agent.next_run_at }]
  let cursor = new Date(agent.next_run_at)
  for (let i = 1; i < count; i++) {
    const next = computeRecurringNextRun(cfg, cursor)
    out.push({ scheduled_for: next })
    cursor = new Date(next)
  }
  return out
}
