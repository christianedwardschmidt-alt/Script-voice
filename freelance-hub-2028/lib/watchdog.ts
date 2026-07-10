import { queryAll, queryOne, execute } from '@/lib/db'
import { notify } from '@/lib/notify'

export type WatchdogCategory = 'financial' | 'relationship' | 'pipeline' | 'tasks' | 'agents' | 'financial_health' | 'growth'
export type ActionType = 'send_reminder' | 'draft_checkin' | 'follow_up' | 'view_details'
export type PriorityColor = 'red' | 'amber' | 'green'

export interface WatchdogAlert {
  category: WatchdogCategory
  priorityScore: number
  priorityColor: PriorityColor
  alertText: string
  actionType: ActionType
  actionLabel: string
  actionData: Record<string, unknown>
}

function money(n: number): string {
  return `$${Number(n ?? 0).toLocaleString()}`
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

// ── Category 1: Financial Alerts ─────────────────────────────────────────────

interface InvoiceRow { id: string; client: string; amount: number; status: string; due: string; issued: string }

async function financialAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const now = new Date()
  const invoices = await queryAll<InvoiceRow>(`SELECT id, client, amount, status, due, issued FROM invoices WHERE user_id = ? AND status != 'Paid' AND due IS NOT NULL AND due != ''`, [userId])

  for (const inv of invoices) {
    const due = new Date(inv.due)
    if (isNaN(due.getTime())) continue
    const daysOverdue = daysBetween(now, due)
    // Some legacy invoice rows store a year-less due date (e.g. "Jan 15"), which
    // JS parses against year 2001 — skip anything that implausibly old rather than
    // let a date-parsing artifact drown out genuine same-week overdue invoices.
    if (daysOverdue >= 1 && daysOverdue <= 730) {
      alerts.push({
        category: 'financial',
        priorityScore: daysOverdue > 7 ? 10 : 9,
        priorityColor: 'red',
        alertText: `${inv.client} Invoice ${inv.id} for ${money(inv.amount)} is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue — no follow-up sent yet`,
        actionType: 'send_reminder',
        actionLabel: 'Send Reminder',
        actionData: { invoiceId: inv.id, client: inv.client, amount: inv.amount, daysOverdue },
      })
    } else if (daysOverdue === 0 || daysOverdue === -1) {
      alerts.push({
        category: 'financial',
        priorityScore: 8,
        priorityColor: 'amber',
        alertText: `${inv.client} Invoice ${inv.id} for ${money(inv.amount)} is due ${daysOverdue === 0 ? 'today' : 'tomorrow'}`,
        actionType: 'view_details',
        actionLabel: 'View Details',
        actionData: { invoiceId: inv.id, client: inv.client, amount: inv.amount },
      })
    }
  }

  const recurring = await queryAll<{ id: number; client_name: string; total: number; next_send_date: string }>(
    `SELECT id, client_name, total, next_send_date FROM recurring_invoice_templates WHERE user_id = ? AND status = 'active'`, [userId]
  )
  for (const r of recurring) {
    const next = new Date(r.next_send_date)
    if (isNaN(next.getTime())) continue
    const daysUntil = daysBetween(next, now)
    if (daysUntil >= 0 && daysUntil <= 1) {
      alerts.push({
        category: 'financial',
        priorityScore: 7,
        priorityColor: 'amber',
        alertText: `Recurring invoice for ${r.client_name} (${money(r.total)}) is scheduled to send within 24 hours`,
        actionType: 'view_details',
        actionLabel: 'View Details',
        actionData: { templateId: r.id, client: r.client_name, amount: r.total },
      })
    }
  }
  return alerts
}

// ── Category 2: Client Relationship Intelligence ─────────────────────────────

interface CrmClientRow { id: number; name: string; company: string; last_contact_at: string | null; value: number }

async function relationshipAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const clients = await queryAll<CrmClientRow>(`SELECT id, name, company, last_contact_at, value FROM crm_clients WHERE user_id = ?`, [userId])
  const now = new Date()

  for (const c of clients) {
    if (!c.last_contact_at) continue
    const last = new Date(c.last_contact_at)
    if (isNaN(last.getTime())) continue
    const days = daysBetween(now, last)
    if (days >= 30) {
      alerts.push({
        category: 'relationship',
        priorityScore: days >= 45 ? 8 : 7,
        priorityColor: 'amber',
        alertText: `You haven't contacted ${c.name}${c.company ? ` (${c.company})` : ''} in ${days} days${c.value >= 5000 ? ` — they've generated ${money(c.value)} in revenue` : ''}`,
        actionType: 'draft_checkin',
        actionLabel: 'Draft Check-in',
        actionData: { clientId: c.id, client: c.name, company: c.company, daysSinceContact: days },
      })
    }
  }

  const viewedProposals = await queryAll<{ id: number; title: string; client_name: string; view_count: number; status: string }>(
    `SELECT id, title, client_name, view_count, status FROM proposals WHERE user_id = ? AND status IN ('sent','viewed') AND view_count >= 2`, [userId]
  )
  for (const p of viewedProposals) {
    alerts.push({
      category: 'relationship',
      priorityScore: 8,
      priorityColor: 'amber',
      alertText: `Your "${p.title}" proposal to ${p.client_name} has been viewed ${p.view_count} times with no response — consider following up today`,
      actionType: 'follow_up',
      actionLabel: 'Follow Up',
      actionData: { proposalId: p.id, title: p.title, client: p.client_name, viewCount: p.view_count },
    })
  }
  return alerts
}

// ── Category 3: Pipeline Intelligence ────────────────────────────────────────

async function pipelineAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const now = new Date()

  const staleProposals = await queryAll<{ id: number; title: string; client_name: string; sent_at: string; total: number }>(
    `SELECT id, title, client_name, sent_at, total FROM proposals WHERE user_id = ? AND status = 'sent' AND sent_at IS NOT NULL AND julianday('now') - julianday(sent_at) >= 7`, [userId]
  )
  for (const p of staleProposals) {
    const days = daysBetween(now, new Date(p.sent_at))
    alerts.push({
      category: 'pipeline',
      priorityScore: 8,
      priorityColor: 'amber',
      alertText: `Your ${money(p.total)} proposal to ${p.client_name} ("${p.title}") has been sitting for ${days} days with no response`,
      actionType: 'follow_up',
      actionLabel: 'Follow Up',
      actionData: { proposalId: p.id, title: p.title, client: p.client_name },
    })
  }

  const profile = await queryOne<{ skills: string }>(`SELECT skills FROM profile WHERE user_id = ?`, [userId])
  const skillWords = (profile?.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  if (skillWords.length) {
    const jobs = await queryAll<{ id: number; title: string; company: string; tags: string }>(`SELECT id, title, company, tags FROM jobs WHERE saved = 0 AND applied = 0`, [])
    const match = jobs.find(j => {
      const tags = (j.tags || '').toLowerCase()
      return skillWords.some(s => tags.includes(s))
    })
    if (match) {
      alerts.push({
        category: 'pipeline',
        priorityScore: 3,
        priorityColor: 'green',
        alertText: `A new opportunity matching your skills just posted: "${match.title}" at ${match.company}`,
        actionType: 'view_details',
        actionLabel: 'View Details',
        actionData: { jobId: match.id, title: match.title, company: match.company },
      })
    }
  }
  return alerts
}

// ── Category 4: Task and Deadline Intelligence ───────────────────────────────

async function taskAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const todayRows = await queryAll<{ id: number; title: string; dueDate: string; priority: string }>(
    `SELECT id, title, dueDate, priority FROM tasks WHERE user_id = ? AND checked = 0 AND date(dueDate) = date('now')`, [userId]
  )
  for (const t of todayRows.slice(0, 3)) {
    alerts.push({
      category: 'tasks',
      priorityScore: t.priority === 'High' ? 7 : 6,
      priorityColor: 'amber',
      alertText: `"${t.title}" is due today${t.priority === 'High' ? ' — marked high priority' : ''}`,
      actionType: 'view_details',
      actionLabel: 'View Details',
      actionData: { taskId: t.id, title: t.title },
    })
  }

  const overdueRows = await queryAll<{ id: number; title: string; dueDate: string }>(
    `SELECT id, title, dueDate FROM tasks WHERE user_id = ? AND checked = 0 AND date(dueDate) < date('now') AND date(dueDate) >= date('now', '-1 day')`, [userId]
  )
  for (const t of overdueRows.slice(0, 2)) {
    alerts.push({
      category: 'tasks',
      priorityScore: 7,
      priorityColor: 'amber',
      alertText: `"${t.title}" was due yesterday and hasn't been completed`,
      actionType: 'view_details',
      actionLabel: 'View Details',
      actionData: { taskId: t.id, title: t.title },
    })
  }
  return alerts
}

// ── Category 5: Agent Performance Intelligence ───────────────────────────────

async function agentAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const failed = await queryAll<{ id: number; agent_id: number; action_taken: string; ran_at: string }>(
    `SELECT ar.id, ar.agent_id, ar.action_taken, ar.ran_at FROM agent_runs ar WHERE ar.user_id = ? AND ar.status = 'failed' AND julianday('now') - julianday(ar.ran_at) <= 1`, [userId]
  )
  for (const f of failed.slice(0, 2)) {
    const agent = await queryOne<{ name: string }>(`SELECT name FROM agents WHERE id = ?`, [f.agent_id])
    alerts.push({
      category: 'agents',
      priorityScore: 6,
      priorityColor: 'amber',
      alertText: `${agent?.name || 'An agent'} failed to run in the last 24 hours — ${f.action_taken}`,
      actionType: 'view_details',
      actionLabel: 'View Details',
      actionData: { agentId: f.agent_id, runId: f.id },
    })
  }

  const pendingSuggestions = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM agent_suggestions WHERE user_id = ? AND accepted = 0 AND dismissed = 0`, [userId]
  )
  if (Number(pendingSuggestions?.cnt ?? 0) > 0) {
    alerts.push({
      category: 'agents',
      priorityScore: 4,
      priorityColor: 'green',
      alertText: `${pendingSuggestions!.cnt} agent suggestion${pendingSuggestions!.cnt === 1 ? '' : 's'} ready for your review based on your business patterns`,
      actionType: 'view_details',
      actionLabel: 'View Details',
      actionData: { count: pendingSuggestions!.cnt },
    })
  }
  return alerts
}

// ── Category 6: Financial Health Intelligence ────────────────────────────────

function quarterlyDeadline(now: Date): { label: string; date: Date } {
  const year = now.getFullYear()
  const deadlines = [
    { label: 'Q1', date: new Date(`${year}-04-15`) },
    { label: 'Q2', date: new Date(`${year}-06-15`) },
    { label: 'Q3', date: new Date(`${year}-09-15`) },
    { label: 'Q4', date: new Date(`${year + 1}-01-15`) },
  ]
  return deadlines.find(d => d.date.getTime() >= now.getTime()) || deadlines[deadlines.length - 1]
}

async function financialHealthAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const now = new Date()

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const [thisMonth, lastMonth] = await Promise.all([
    queryOne<{ total: number }>(`SELECT COALESCE(SUM(amount),0) as total FROM invoice_payments WHERE user_id = ? AND paid_at >= ?`, [userId, thisMonthStart]),
    queryOne<{ total: number }>(`SELECT COALESCE(SUM(amount),0) as total FROM invoice_payments WHERE user_id = ? AND paid_at >= ? AND paid_at < ?`, [userId, lastMonthStart, thisMonthStart]),
  ])
  const revThis = Number(thisMonth?.total ?? 0)
  const revLast = Number(lastMonth?.total ?? 0)

  const settings = await queryOne<{ annual_revenue_goal: number }>(`SELECT annual_revenue_goal FROM settings WHERE user_id = ?`, [userId])
  const goal = Number(settings?.annual_revenue_goal ?? 0)

  if (revThis > 0) {
    const pctChange = revLast > 0 ? Math.round(((revThis - revLast) / revLast) * 100) : null
    const onTrackText = goal > 0 ? ` and on track for your ${money(goal)} annual goal` : ''
    if (pctChange !== null && pctChange >= 10) {
      alerts.push({
        category: 'financial_health',
        priorityScore: 5,
        priorityColor: 'green',
        alertText: `Your revenue this month is ${money(revThis)} — ${pctChange}% ahead of last month${onTrackText}`,
        actionType: 'view_details',
        actionLabel: 'View Details',
        actionData: { revenueThisMonth: revThis, revenueLastMonth: revLast, pctChange, goal },
      })
    } else if (pctChange !== null && pctChange <= -10) {
      alerts.push({
        category: 'financial_health',
        priorityScore: 6,
        priorityColor: 'amber',
        alertText: `Your revenue this month is ${money(revThis)} — ${Math.abs(pctChange)}% behind last month`,
        actionType: 'view_details',
        actionLabel: 'View Details',
        actionData: { revenueThisMonth: revThis, revenueLastMonth: revLast, pctChange, goal },
      })
    }
  }

  const deadline = quarterlyDeadline(now)
  const daysUntilTax = daysBetween(deadline.date, now)
  if (daysUntilTax >= 0 && daysUntilTax <= 30) {
    const estimate = Math.round(revThis * 0.25) || 0
    alerts.push({
      category: 'financial_health',
      priorityScore: 9,
      priorityColor: 'amber',
      alertText: `${deadline.label} estimated tax payment due in ${daysUntilTax} day${daysUntilTax === 1 ? '' : 's'}${estimate > 0 ? ` — GuildWire estimates ${money(estimate)} based on your income this quarter` : ''}`,
      actionType: 'view_details',
      actionLabel: 'Review Now',
      actionData: { quarter: deadline.label, daysUntil: daysUntilTax, estimate },
    })
  }
  return alerts
}

// ── Category 7: Growth Intelligence ──────────────────────────────────────────

async function growthAlerts(userId: number): Promise<WatchdogAlert[]> {
  const alerts: WatchdogAlert[] = []
  const trending = await queryAll<{ id: number; author: string; content: string; likes: number; comments: number }>(
    `SELECT id, author, content, likes, comments FROM posts WHERE trending = 1 AND user_id != ? ORDER BY likes DESC LIMIT 1`, [userId]
  )
  for (const p of trending) {
    const snippet = p.content.length > 60 ? p.content.slice(0, 57) + '…' : p.content
    alerts.push({
      category: 'growth',
      priorityScore: 2,
      priorityColor: 'green',
      alertText: `${p.author}'s post is trending in the community (${p.likes} likes, ${p.comments} comments): "${snippet}"`,
      actionType: 'view_details',
      actionLabel: 'View Details',
      actionData: { postId: p.id, author: p.author },
    })
  }
  return alerts
}

// ── Aggregation, scoring, selection ──────────────────────────────────────────

export async function collectWatchdogAlerts(userId: number): Promise<WatchdogAlert[]> {
  const [financial, relationship, pipeline, tasks, agents, financialHealth, growth] = await Promise.all([
    financialAlerts(userId),
    relationshipAlerts(userId),
    pipelineAlerts(userId),
    taskAlerts(userId),
    agentAlerts(userId),
    financialHealthAlerts(userId),
    growthAlerts(userId),
  ])
  return [...financial, ...relationship, ...pipeline, ...tasks, ...agents, ...financialHealth, ...growth]
}

const MAX_ITEMS = 5

export function prioritizeAndSelect(alerts: WatchdogAlert[]): WatchdogAlert[] {
  return [...alerts].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, MAX_ITEMS)
}

// ── Nightly run orchestration ────────────────────────────────────────────────

export async function runWatchdogForUser(userId: number): Promise<{ generated: number; shown: number }> {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const allAlerts = await collectWatchdogAlerts(userId)
  const selected = prioritizeAndSelect(allAlerts)

  const runResult = await execute(
    `INSERT INTO watchdog_runs (user_id,run_date,items_generated,items_shown,items_resolved,items_dismissed,created_at) VALUES (?,?,?,?,0,0,?)`,
    [userId, today, allAlerts.length, selected.length, now]
  )
  const runId = Number(runResult.lastInsertRowid)

  for (const item of selected) {
    await execute(
      `INSERT INTO watchdog_items (watchdog_run_id,user_id,category,priority_score,priority_color,alert_text,action_type,action_data,resolved,dismissed,created_at) VALUES (?,?,?,?,?,?,?,?,0,0,?)`,
      [runId, userId, item.category, item.priorityScore, item.priorityColor, item.alertText, item.actionType, JSON.stringify({ ...item.actionData, actionLabel: item.actionLabel }), now]
    )
  }

  if (selected.length > 0) {
    await notify({
      userId,
      type: 'watchdog_briefing',
      title: `Your GuildWire Watchdog has ${selected.length} item${selected.length === 1 ? '' : 's'} waiting for you this morning`,
      body: selected[0].alertText,
      href: '/dashboard',
    })
  }

  return { generated: allAlerts.length, shown: selected.length }
}

interface ActiveUserRow { id: number }

export async function runNightlyWatchdog(): Promise<{ usersProcessed: number; totalItemsShown: number }> {
  const users = await queryAll<ActiveUserRow>(`SELECT id FROM users`)
  let totalItemsShown = 0
  for (const u of users) {
    const result = await runWatchdogForUser(u.id)
    totalItemsShown += result.shown
  }
  return { usersProcessed: users.length, totalItemsShown }
}
