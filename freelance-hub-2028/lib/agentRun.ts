import Anthropic from '@anthropic-ai/sdk'
import { queryAll, queryOne, execute } from '@/lib/db'

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
type CollaboratorRow = { id: number; collaborator_name: string; collaborator_email: string; collaborator_user_id: number | null }

const ACTION_LABELS: Record<string, string> = {
  'send-email': 'Sent an email',
  'notify-me': 'Sent a notification',
  'notify-collaborator': 'Notified a collaborator',
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

function relativeDueDays(rel: string): number {
  if (rel.includes('week')) return 7
  if (rel.includes('1 day')) return 1
  return 3
}

function buildCollaboratorEmail(params: {
  ownerName: string
  collaboratorName: string
  notificationType: 'message' | 'task' | 'document'
  message: string
  taskTitle: string
  taskDueLabel: string
  taskPriority: string
  documentLabel: string
  showConversionPrompt: boolean
}): { subject: string; html: string } {
  const { ownerName, collaboratorName, notificationType, message, taskTitle, taskDueLabel, taskPriority, documentLabel, showConversionPrompt } = params

  const bodyContent = notificationType === 'task'
    ? `<p style="margin:0 0 6px;font-size:15px;color:#111827;line-height:1.6;"><strong>${taskTitle}</strong></p><p style="margin:0;font-size:14px;color:#4B5563;">Due: ${taskDueLabel} &middot; Priority: ${taskPriority}</p>`
    : notificationType === 'document'
      ? `<p style="margin:0;font-size:15px;color:#111827;line-height:1.6;">${ownerName} shared ${documentLabel} with you.</p>`
      : `<p style="margin:0;font-size:15px;color:#111827;line-height:1.6;">${message}</p>`

  const conversionBlock = showConversionPrompt
    ? `<p style="margin:20px 0 0;font-size:13px;color:#6B7280;line-height:1.6;border-top:1px solid #E5E7EB;padding-top:16px;">You&rsquo;ve been collaborating with ${ownerName} through GuildWire. Want to manage your own independent practice here too? 30 days free.</p>`
    : ''

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#14532D;padding:22px 28px;border-radius:12px 12px 0 0;">
    <span style="font-size:20px;font-weight:700;color:#fff;">Guild<span style="color:#4ADE80;">Wire</span></span>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;font-size:13px;color:#6B7280;">Hi ${collaboratorName},</p>
    ${bodyContent}
    ${conversionBlock}
    <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">GuildWire helps independent professionals manage their business &mdash; learn more at guildwire.io</p>
  </div>
</div>`

  return { subject: `${ownerName} shared something with you via GuildWire`, html }
}

async function notifyCollaborator(
  actionConfig: Record<string, string>,
  agent: SimAgent,
  userId: number,
  runId: number | undefined
): Promise<{ summary: string; log: Record<string, unknown> } | null> {
  const collaboratorId = Number(actionConfig.collaboratorId)
  if (!collaboratorId) return null

  const collab = await queryOne<CollaboratorRow>(
    `SELECT id, collaborator_name, collaborator_email, collaborator_user_id FROM collaborators WHERE id = ? AND owner_user_id = ?`,
    [collaboratorId, userId]
  )
  if (!collab) return null

  const [owner, client, invoice, proposal] = await Promise.all([
    queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [userId]),
    pickClient(userId),
    pickInvoice(userId, true),
    pickProposal(userId, 'sent'),
  ])
  const ownerName = owner?.name || 'A GuildWire member'

  const vars: Record<string, string> = {
    '{{client_name}}': client?.name ?? 'a client',
    '{{invoice_amount}}': invoice ? money(invoice.amount) : '$0',
    '{{due_date}}': invoice?.due ?? 'soon',
    '{{proposal_title}}': proposal?.title ?? 'the proposal',
    '{{agent_name}}': agent.name,
  }
  const substitute = (text: string) => Object.entries(vars).reduce((t, [k, v]) => t.split(k).join(v), text)

  const notificationType = ((actionConfig.notificationType || 'message') as 'message' | 'task' | 'document')
  const isMember = !!collab.collaborator_user_id

  let message = ''
  let taskTitle = ''
  let taskDueDate: string | null = null
  let taskDueLabel = ''
  let taskPriority = ''
  let documentLabel = 'a document'
  let summary = ''

  if (notificationType === 'task') {
    taskTitle = substitute(actionConfig.taskTitle || `Follow up regarding ${agent.name}`)
    taskPriority = actionConfig.taskPriority || 'Medium'
    if ((actionConfig.taskDueType || 'relative') === 'specific' && actionConfig.taskDueDate) {
      taskDueDate = actionConfig.taskDueDate
      taskDueLabel = new Date(actionConfig.taskDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      const rel = actionConfig.taskDueRelative || 'in 3 days'
      const due = new Date(Date.now() + relativeDueDays(rel) * 86400000)
      taskDueDate = due.toISOString().slice(0, 10)
      taskDueLabel = rel
    }
    summary = `Notified ${collab.collaborator_name} and assigned them "${taskTitle}" due ${taskDueLabel}.`
  } else if (notificationType === 'document') {
    documentLabel = actionConfig.documentRef?.startsWith('proposal-') ? 'a proposal' : actionConfig.documentRef?.startsWith('note-') ? 'a note' : 'a document'
    summary = `Notified ${collab.collaborator_name} and shared ${documentLabel} with them.`
  } else {
    message = substitute(actionConfig.message || `An update from ${agent.name}.`)
    const short = message.length > 70 ? message.slice(0, 67) + '…' : message
    summary = `Notified ${collab.collaborator_name} about "${short}"`
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const priorCount = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM collaborator_notifications WHERE collaborator_id = ? AND created_at >= ?`,
    [collab.id, thirtyDaysAgo]
  )
  const showConversionPrompt = !isMember && Number(priorCount?.cnt ?? 0) >= 3

  const { subject, html } = buildCollaboratorEmail({
    ownerName, collaboratorName: collab.collaborator_name, notificationType, message, taskTitle, taskDueLabel, taskPriority, documentLabel, showConversionPrompt,
  })

  const now = new Date().toISOString()
  await execute(
    `INSERT INTO email_log (user_id,to_email,subject,body_html,related_type,related_id,status,sent_at) VALUES (?,?,?,?,?,?,?,?)`,
    [userId, collab.collaborator_email, subject, html, 'collaborator_notification', String(collab.id), 'sent', now]
  )

  let deliveryMethod: 'email' | 'both' = 'email'
  if (isMember && collab.collaborator_user_id) {
    deliveryMethod = 'both'
    await execute(
      `INSERT INTO notifications (user_id,type,title,body,href,created_at) VALUES (?,?,?,?,?,?)`,
      [collab.collaborator_user_id, 'collaborator_notification', subject, notificationType === 'task' ? taskTitle : (message || `${ownerName} shared ${documentLabel} with you.`), '/notifications', now]
    )
  }

  await execute(
    `INSERT INTO collaborator_notifications (agent_run_id,collaborator_id,notification_type,message,task_title,task_due_date,task_priority,delivered_at,delivery_method,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [runId ?? null, collab.id, notificationType, message, taskTitle, taskDueDate, taskPriority, now, deliveryMethod, now]
  )

  return {
    summary,
    log: {
      involved_collaborator: true,
      collaborator_notified: collab.collaborator_name,
      notification_type: notificationType,
      delivery_method: deliveryMethod,
      ...(notificationType === 'message' ? { message } : {}),
      ...(notificationType === 'task' ? { task_title: taskTitle, task_due: taskDueLabel, task_priority: taskPriority } : {}),
      ...(notificationType === 'document' ? { document: documentLabel } : {}),
      conversion_prompt_included: showConversionPrompt,
    },
  }
}

export async function simulateAgentRun(agent: SimAgent, userId: number, triggerEvent: string, runId?: number): Promise<RunOutcome> {
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
      const actions = (agent.actions || []) as { type?: string; config?: Record<string, string> }[]
      const collabAction = actions.find(a => a.type === 'notify-collaborator')

      if (collabAction) {
        const result = await notifyCollaborator(collabAction.config || {}, agent, userId, runId)
        if (result) {
          return { status: 'success', actionTaken: result.summary, technicalLog: { ...base, ...result.log } }
        }
        return {
          status: 'partial',
          actionTaken: 'Tried to notify a collaborator, but none was selected for this action.',
          technicalLog: { ...base, reason: 'no_collaborator_selected' },
        }
      }

      const c = await pickClient(userId)
      const status = weighted(0.75, 0.12)
      const labels = actions
        .map(a => a.type)
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
