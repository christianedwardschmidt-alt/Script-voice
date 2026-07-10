import Anthropic from '@anthropic-ai/sdk'
import { queryAll, execute } from '@/lib/db'

const anthropic = new Anthropic()

export interface RunOutcome {
  status: 'success' | 'failed' | 'partial'
  actionTaken: string
  technicalLog: Record<string, unknown>
}

export type SimAgent = {
  id: number
  name: string
  template_id: string
  trigger_type: string
  actions: unknown[]
}

type ClientRow = { name: string; company: string; email: string }
type InvoiceRow = { id: string; client: string; amount: number; status: string; due: string; issued: string }
type ProposalRow = { title: string; client_name: string; total: number; sent_at: string | null; status: string }

const ACTION_LABELS: Record<string, string> = {
  'send-email': 'Sent an email',
  'notify-me': 'Sent a notification',
  'create-task': 'Created a task',
  'add-note': 'Added a note',
  'update-status': 'Updated client status',
  'generate-report': 'Generated a report',
  'wait': 'Waited then continued',
}

function weighted(successP: number, failedP: number): 'success' | 'failed' | 'partial' {
  const r = Math.random()
  if (r < successP) return 'success'
  if (r < successP + failedP) return 'failed'
  return 'partial'
}

function invoiceLabel(id: string): string {
  const m = id.match(/(\d+)$/)
  return m ? `#${m[1].padStart(4, '0')}` : id
}

function daysBetween(iso: string): number | null {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.round((Date.now() - d.getTime()) / 86400000)
}

function money(n: number): string {
  return `$${Number(n ?? 0).toLocaleString()}`
}

async function pickClient(userId: number): Promise<ClientRow | null> {
  const rows = await queryAll<ClientRow>(
    `SELECT name, company, email FROM crm_clients WHERE user_id = ? ORDER BY RANDOM() LIMIT 1`, [userId]
  )
  if (rows.length) return rows[0]
  const fallback = await queryAll<ClientRow>(
    `SELECT name, company, email FROM clients WHERE user_id = ? ORDER BY RANDOM() LIMIT 1`, [userId]
  )
  return fallback[0] ?? null
}

async function pickInvoice(userId: number, preferUnpaid: boolean): Promise<InvoiceRow | null> {
  if (preferUnpaid) {
    const rows = await queryAll<InvoiceRow>(
      `SELECT * FROM invoices WHERE user_id = ? AND status != 'Paid' ORDER BY RANDOM() LIMIT 1`, [userId]
    )
    if (rows.length) return rows[0]
  }
  const any = await queryAll<InvoiceRow>(`SELECT * FROM invoices WHERE user_id = ? ORDER BY RANDOM() LIMIT 1`, [userId])
  return any[0] ?? null
}

async function pickProposal(userId: number, status: string): Promise<ProposalRow | null> {
  const rows = await queryAll<ProposalRow>(
    `SELECT title, client_name, total, sent_at, status FROM proposals WHERE user_id = ? AND status = ? ORDER BY RANDOM() LIMIT 1`,
    [userId, status]
  )
  return rows[0] ?? null
}

export async function simulateAgentRun(agent: SimAgent, userId: number, triggerEvent: string): Promise<RunOutcome> {
  const base = { agent: agent.name, trigger: triggerEvent }

  switch (agent.template_id) {
    case 'invoice-reminder': {
      const inv = await pickInvoice(userId, true)
      if (!inv) {
        return { status: 'partial', actionTaken: 'No unpaid invoices found to send a reminder for.', technicalLog: { ...base, reason: 'no_matching_invoice' } }
      }
      const status = weighted(0.7, 0.15)
      const days = daysBetween(inv.due) ?? 0
      if (status === 'failed') {
        return {
          status,
          actionTaken: `Tried to send a payment reminder to ${inv.client} for invoice ${invoiceLabel(inv.id)} but their email address bounced.`,
          technicalLog: { ...base, client: inv.client, invoice_id: inv.id, amount: inv.amount, due: inv.due, days_overdue: days, failure_reason: 'email_bounced' },
        }
      }
      return {
        status,
        actionTaken: `Sent a payment reminder to ${inv.client} for invoice ${invoiceLabel(inv.id)} — ${money(inv.amount)} outstanding.`,
        technicalLog: { ...base, client: inv.client, invoice_id: inv.id, amount: inv.amount, due: inv.due, days_overdue: days, channel: 'email' },
      }
    }

    case 'followup-email': {
      const c = await pickClient(userId)
      if (!c) return { status: 'partial', actionTaken: 'No clients found to follow up with.', technicalLog: { ...base, reason: 'no_matching_client' } }
      const status = weighted(0.75, 0.1)
      return status === 'failed'
        ? { status, actionTaken: `Tried to follow up with ${c.name} (${c.company}) but the email on file didn't deliver.`, technicalLog: { ...base, client: c.name, company: c.company, email: c.email, failure_reason: 'delivery_failed' } }
        : { status, actionTaken: `Sent a follow-up email to ${c.name} (${c.company}) — no response since last contact.`, technicalLog: { ...base, client: c.name, company: c.company, email: c.email, channel: 'email' } }
    }

    case 'new-client-welcome': {
      const c = await pickClient(userId)
      if (!c) return { status: 'partial', actionTaken: 'No new clients found to welcome.', technicalLog: { ...base, reason: 'no_matching_client' } }
      const status = weighted(0.85, 0.05)
      return status === 'failed'
        ? { status, actionTaken: `Tried to send a welcome email to ${c.name} at ${c.company} but the email address was invalid.`, technicalLog: { ...base, client: c.name, company: c.company, email: c.email, failure_reason: 'invalid_email' } }
        : { status, actionTaken: `Sent a welcome email to ${c.name} at ${c.company} and created their onboarding task.`, technicalLog: { ...base, client: c.name, company: c.company, email: c.email, onboarding_task_created: true } }
    }

    case 'project-kickoff': {
      const p = await pickProposal(userId, 'accepted')
      if (!p) return { status: 'partial', actionTaken: 'No recently accepted proposals found to kick off.', technicalLog: { ...base, reason: 'no_matching_proposal' } }
      const status = weighted(0.85, 0.05)
      return {
        status,
        actionTaken: status === 'failed'
          ? `Tried to send a project kickoff message to ${p.client_name} for "${p.title}" but delivery failed.`
          : `Sent a project kickoff message to ${p.client_name} for "${p.title}" with next steps.`,
        technicalLog: { ...base, client: p.client_name, project: p.title, value: p.total },
      }
    }

    case 'proposal-followup': {
      const p = await pickProposal(userId, 'sent')
      if (!p) return { status: 'partial', actionTaken: 'No pending proposals found to follow up on.', technicalLog: { ...base, reason: 'no_matching_proposal' } }
      const days = p.sent_at ? daysBetween(p.sent_at) : null
      const status = weighted(0.6, 0.05)
      return {
        status: status === 'failed' ? 'partial' : status,
        actionTaken: `Followed up with ${p.client_name} about "${p.title}"${days != null ? ` sent ${days} day${days === 1 ? '' : 's'} ago` : ''} — no response yet, flagged for manual follow-up.`,
        technicalLog: { ...base, client: p.client_name, proposal: p.title, value: p.total, days_since_sent: days },
      }
    }

    case 'proposal-won': {
      const p = await pickProposal(userId, 'accepted')
      if (!p) return { status: 'partial', actionTaken: 'No newly won proposals found to celebrate.', technicalLog: { ...base, reason: 'no_matching_proposal' } }
      return {
        status: 'success',
        actionTaken: `Sent a thank-you note to ${p.client_name} for accepting "${p.title}" — ${money(p.total)} project.`,
        technicalLog: { ...base, client: p.client_name, proposal: p.title, value: p.total },
      }
    }

    case 'weekly-revenue': {
      const rows = await queryAll<{ status: string; amount: number }>(`SELECT status, amount FROM invoices WHERE user_id = ?`, [userId])
      const paid = rows.filter(r => r.status === 'Paid').reduce((s, r) => s + Number(r.amount ?? 0), 0)
      const outstanding = rows.filter(r => r.status !== 'Paid').reduce((s, r) => s + Number(r.amount ?? 0), 0)
      return {
        status: 'success',
        actionTaken: `Sent your weekly revenue report — ${money(paid)} collected, ${money(outstanding)} outstanding across ${rows.filter(r => r.status !== 'Paid').length} invoice(s).`,
        technicalLog: { ...base, paid_total: paid, outstanding_total: outstanding, invoice_count: rows.length },
      }
    }

    case 'low-invoice-alert': {
      const rows = await queryAll<{ id: string }>(`SELECT id FROM invoices WHERE user_id = ? AND status != 'Paid'`, [userId])
      const threshold = 3
      const low = rows.length < threshold
      return {
        status: 'success',
        actionTaken: low
          ? `Alerted you that you only have ${rows.length} active invoice(s) — below your pipeline threshold of ${threshold}.`
          : `Checked your pipeline — ${rows.length} active invoices, above your threshold of ${threshold}. No alert needed.`,
        technicalLog: { ...base, active_invoices: rows.length, threshold },
      }
    }

    case 'community-welcome': {
      const status = weighted(0.9, 0.05)
      return {
        status,
        actionTaken: status === 'failed' ? 'Tried to welcome a new community member but the message failed to send.' : 'Welcomed a new GuildWire community member with a personal message.',
        technicalLog: { ...base },
      }
    }

    default: {
      const c = await pickClient(userId)
      const status = weighted(0.75, 0.12)
      const labels = (agent.actions || [])
        .map(a => (a as { type?: string })?.type)
        .filter((t): t is string => !!t)
        .map(t => ACTION_LABELS[t] || t)
      const desc = labels.length ? labels.join(' — ') : `Ran "${agent.name}"`
      return {
        status,
        actionTaken: c ? `${desc} for ${c.name} (${c.company}).` : `${desc}.`,
        technicalLog: { ...base, actions: agent.actions, client: c },
      }
    }
  }
}

export async function generateRunSummary(params: {
  agentName: string
  triggerEvent: string
  status: string
  actionTaken: string
  technicalLog: Record<string, unknown>
}): Promise<string | null> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system: 'An automated business agent just ran for an independent professional. Describe in one plain English sentence what it did, using the specific names, amounts, dates, and outcomes from the action data provided. Sound like a knowledgeable colleague giving a quick update, not a system log. Start with what happened, not with the agent name. Be specific.',
      messages: [{
        role: 'user',
        content: `Agent: ${params.agentName}\nTrigger: ${params.triggerEvent}\nOutcome: ${params.status}\nPlain description: ${params.actionTaken}\nFull action data: ${JSON.stringify(params.technicalLog, null, 2)}`,
      }],
    })
    const text = response.content.find(b => b.type === 'text')?.text
    return text ?? null
  } catch {
    return null
  }
}

export async function pruneAgentRuns(agentId: number): Promise<void> {
  await execute(
    `DELETE FROM agent_runs WHERE agent_id = ? AND id NOT IN (
      SELECT id FROM agent_runs WHERE agent_id = ? ORDER BY id DESC LIMIT 500
    )`,
    [agentId, agentId]
  )
}
