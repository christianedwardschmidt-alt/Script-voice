import { addDays, addWeeks, addMonths, addQuarters, addYears, format, parseISO } from 'date-fns'
import { queryAll, queryOne, execute, logActivity } from './db'
import { notify } from './notify'
import { sendEmail, emailTemplate } from './email'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export interface RecurringTemplate {
  id: number
  user_id: number
  client_name: string
  client_email: string
  project: string
  line_items: string
  subtotal: number
  tax_rate: number
  total: number
  amount_mode: 'fixed' | 'variable'
  frequency: string
  custom_interval: number
  custom_period: string
  start_date: string
  end_condition: 'indefinite' | 'after_occurrences' | 'on_date'
  end_after_occurrences: number | null
  end_date: string | null
  send_time: string
  next_send_date: string
  total_sends: number
  client_notification_enabled: number
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  avatar: string
  color: string
  last_presend_notified_date: string | null
  created_at: string
  updated_at: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.guildwire.io'

// ── Date math ────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function addFrequency(dateStr: string, frequency: string, customInterval = 1, customPeriod = 'days'): string {
  const d = parseISO(dateStr)
  switch (frequency) {
    case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd')
    case 'biweekly': return format(addWeeks(d, 2), 'yyyy-MM-dd')
    case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd')
    case 'quarterly': return format(addQuarters(d, 1), 'yyyy-MM-dd')
    case 'annually': return format(addYears(d, 1), 'yyyy-MM-dd')
    case 'custom':
      if (customPeriod === 'weeks') return format(addWeeks(d, customInterval), 'yyyy-MM-dd')
      if (customPeriod === 'months') return format(addMonths(d, customInterval), 'yyyy-MM-dd')
      return format(addDays(d, customInterval), 'yyyy-MM-dd')
    default: return format(addMonths(d, 1), 'yyyy-MM-dd')
  }
}

// Guarantees the first send is never the day the schedule was created — always
// the next occurrence strictly after "createdOn", regardless of the chosen start date.
export function firstSendDate(startDate: string, frequency: string, customInterval: number, customPeriod: string, createdOn: string): string {
  let next = startDate
  while (next <= createdOn) {
    next = addFrequency(next, frequency, customInterval, customPeriod)
  }
  return next
}

export function upcomingOccurrences(t: Pick<RecurringTemplate, 'next_send_date' | 'frequency' | 'custom_interval' | 'custom_period'>, count = 3): string[] {
  const out: string[] = []
  let d = t.next_send_date
  for (let i = 0; i < count; i++) {
    out.push(d)
    d = addFrequency(d, t.frequency, t.custom_interval, t.custom_period)
  }
  return out
}

export function humanFrequency(frequency: string, customInterval?: number, customPeriod?: string): string {
  switch (frequency) {
    case 'weekly': return 'weekly'
    case 'biweekly': return 'every 2 weeks'
    case 'monthly': return 'monthly'
    case 'quarterly': return 'quarterly'
    case 'annually': return 'annually'
    case 'custom': return `every ${customInterval} ${customPeriod}`
    default: return frequency
  }
}

function checkEndCondition(t: RecurringTemplate, newNextSendDate: string): boolean {
  if (t.end_condition === 'after_occurrences' && t.end_after_occurrences != null && t.total_sends + 1 >= t.end_after_occurrences) return true
  if (t.end_condition === 'on_date' && t.end_date && newNextSendDate > t.end_date) return true
  return false
}

// ── Invoice numbering (mirrors app/api/invoices/route.ts) ──────────────────────

async function nextInvoiceId(userId: number): Promise<string> {
  const last = await queryOne<{ id: string }>(`SELECT id FROM invoices WHERE user_id = ? ORDER BY rowid DESC LIMIT 1`, [userId])
  let nextNum = 100
  if (last?.id) {
    const m = last.id.match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  return `INV-${userId}-${String(nextNum).padStart(3, '0')}`
}

// ── Generation ───────────────────────────────────────────────────────────────

async function generateFixedInvoice(t: RecurringTemplate): Promise<string> {
  const id = await nextInvoiceId(t.user_id)
  const today = todayStr()
  const due = format(addDays(new Date(), 14), 'yyyy-MM-dd')
  await execute(
    `INSERT INTO invoices (id,user_id,client,project,amount,status,issued,due,avatar,color,recurring_template_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, t.user_id, t.client_name, t.project, t.total, 'Pending', today, due, t.avatar, t.color, t.id]
  )
  return id
}

async function generateVariableDraft(t: RecurringTemplate): Promise<string> {
  const id = await nextInvoiceId(t.user_id)
  const today = todayStr()
  const due = format(addDays(parseISO(t.next_send_date), 14), 'yyyy-MM-dd')
  await execute(
    `INSERT INTO invoices (id,user_id,client,project,amount,status,issued,due,avatar,color,recurring_template_id,awaiting_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, t.user_id, t.client_name, t.project, 0, 'Draft', today, due, t.avatar, t.color, t.id, 1]
  )
  return id
}

// ── Notification content ────────────────────────────────────────────────────

async function notifyPresend(t: RecurringTemplate) {
  const amountLabel = t.amount_mode === 'fixed' ? `$${t.total.toLocaleString()}` : 'a variable amount'
  const title = `Recurring invoice to ${t.client_name} sends tomorrow`
  const body = `Your recurring invoice to ${t.client_name} for ${amountLabel} sends tomorrow at ${t.send_time}. Make any changes before then.`
  const href = `/invoicing?tab=recurring&template=${t.id}`
  await notify({
    userId: t.user_id, type: 'recurring_invoice_presend', title, body, href,
    meta: { templateId: t.id, canPause: true },
  })
  await sendEmail({
    userId: t.user_id, to: t.client_email || '', subject: title,
    html: emailTemplate({
      heading: title,
      bodyLines: [body, `You can pause this schedule any time before it sends.`],
      ctaLabel: 'Review recurring invoice', ctaHref: `${APP_URL}${href}`,
    }),
    relatedType: 'recurring_invoice', relatedId: String(t.id),
  })
}

async function notifyFired(t: RecurringTemplate, invoiceId: string) {
  const title = `Recurring invoice sent to ${t.client_name}`
  const body = `Your recurring invoice to ${t.client_name} for $${t.total.toLocaleString()} was sent automatically this morning.`
  await notify({ userId: t.user_id, type: 'recurring_invoice_sent', title, body, href: `/invoicing?invoice=${invoiceId}`, meta: { templateId: t.id, invoiceId } })
  await sendEmail({
    userId: t.user_id, to: t.client_email || '', subject: title,
    html: emailTemplate({ heading: title, bodyLines: [body], ctaLabel: 'View invoice', ctaHref: `${APP_URL}/invoicing?invoice=${invoiceId}` }),
    relatedType: 'recurring_invoice', relatedId: String(t.id),
  })
}

async function notifyDraftNeedsAmount(t: RecurringTemplate, invoiceId: string) {
  const title = `Recurring invoice to ${t.client_name} needs an amount`
  const body = `Your variable-amount recurring invoice to ${t.client_name} is drafted and sends in 2 days. Fill in the amount before it fires.`
  const href = `/invoicing?tab=recurring&template=${t.id}`
  await notify({ userId: t.user_id, type: 'recurring_invoice_needs_amount', title, body, href, meta: { templateId: t.id, invoiceId } })
  await sendEmail({
    userId: t.user_id, to: t.client_email || '', subject: title,
    html: emailTemplate({ heading: title, bodyLines: [body], ctaLabel: 'Enter amount', ctaHref: `${APP_URL}${href}` }),
    relatedType: 'recurring_invoice', relatedId: String(t.id),
  })
}

async function notifyFailure(t: RecurringTemplate, errorMessage: string, willRetry: boolean) {
  const title = willRetry
    ? `Recurring invoice to ${t.client_name} failed to send`
    : `Recurring invoice to ${t.client_name} paused — needs review`
  const body = willRetry
    ? `Your recurring invoice to ${t.client_name} failed to send: ${errorMessage}. We'll automatically retry in 24 hours.`
    : `Your recurring invoice to ${t.client_name} failed again after a retry: ${errorMessage}. This schedule has been paused — review and reactivate it when ready.`
  const href = `/invoicing?tab=recurring&template=${t.id}`
  await notify({ userId: t.user_id, type: willRetry ? 'recurring_invoice_failed' : 'recurring_invoice_autopaused', title, body, href, meta: { templateId: t.id } })
  await sendEmail({
    userId: t.user_id, to: t.client_email || '', subject: title,
    html: emailTemplate({ heading: title, bodyLines: [body], ctaLabel: 'Review schedule', ctaHref: `${APP_URL}${href}` }),
    relatedType: 'recurring_invoice', relatedId: String(t.id),
  })
}

// ── Core per-template actions (used by both the cron job and manual API calls) ─

export async function fireFixedTemplate(t: RecurringTemplate): Promise<{ invoiceId: string }> {
  const invoiceId = await generateFixedInvoice(t)
  const newNextSendDate = addFrequency(t.next_send_date, t.frequency, t.custom_interval, t.custom_period)
  const completed = checkEndCondition(t, newNextSendDate)
  await execute(
    `UPDATE recurring_invoice_templates SET total_sends = total_sends + 1, next_send_date = ?, status = ?, updated_at = ? WHERE id = ?`,
    [newNextSendDate, completed ? 'completed' : 'active', new Date().toISOString(), t.id]
  )
  await execute(
    `INSERT INTO recurring_invoice_logs (template_id, invoice_id, scheduled_date, sent_at, status, retry_count, created_at) VALUES (?,?,?,?,?,?,?)`,
    [t.id, invoiceId, t.next_send_date, new Date().toISOString(), 'success', 0, new Date().toISOString()]
  )
  logActivity(t.user_id, `Recurring invoice ${invoiceId} sent automatically to ${t.client_name} — $${t.total.toLocaleString()}`)
  if (t.client_notification_enabled) await notifyFired(t, invoiceId)
  else {
    await notify({ userId: t.user_id, type: 'recurring_invoice_sent', title: `Recurring invoice sent to ${t.client_name}`, body: `Your recurring invoice to ${t.client_name} for $${t.total.toLocaleString()} was sent automatically this morning.`, href: `/invoicing?invoice=${invoiceId}`, meta: { templateId: t.id, invoiceId } })
  }
  return { invoiceId }
}

export async function generateDraftForTemplate(t: RecurringTemplate): Promise<{ invoiceId: string }> {
  const invoiceId = await generateVariableDraft(t)
  await execute(
    `INSERT INTO recurring_invoice_logs (template_id, invoice_id, scheduled_date, status, retry_count, created_at) VALUES (?,?,?,?,?,?)`,
    [t.id, invoiceId, t.next_send_date, 'pending_amount', 0, new Date().toISOString()]
  )
  await notifyDraftNeedsAmount(t, invoiceId)
  return { invoiceId }
}

export async function approveDraftAndFire(t: RecurringTemplate, invoiceId: string, amount: number): Promise<void> {
  const today = todayStr()
  await execute(`UPDATE invoices SET amount = ?, status = 'Pending', awaiting_amount = 0 WHERE id = ? AND user_id = ?`, [amount, invoiceId, t.user_id])
  await execute(`UPDATE recurring_invoice_logs SET status = 'success', sent_at = ? WHERE template_id = ? AND invoice_id = ?`, [new Date().toISOString(), t.id, invoiceId])
  const newNextSendDate = addFrequency(t.next_send_date, t.frequency, t.custom_interval, t.custom_period)
  const completed = checkEndCondition(t, newNextSendDate)
  await execute(
    `UPDATE recurring_invoice_templates SET total_sends = total_sends + 1, next_send_date = ?, status = ?, updated_at = ? WHERE id = ?`,
    [newNextSendDate, completed ? 'completed' : 'active', new Date().toISOString(), t.id]
  )
  logActivity(t.user_id, `Recurring invoice ${invoiceId} sent — $${amount.toLocaleString()} (amount confirmed) to ${t.client_name}`)
  if (t.client_notification_enabled) await notifyFired({ ...t, total: amount }, invoiceId)
  void today
}

// ── Daily cron orchestrator ─────────────────────────────────────────────────

export interface DailyJobResult {
  presend: number
  fired: number
  variableDrafts: number
  retriesSucceeded: number
  retriesFailedAgain: number
  newFailures: number
}

export async function runDailyRecurringInvoiceJob(): Promise<DailyJobResult> {
  const today = todayStr()
  const tomorrow = addFrequency(today, 'custom', 1, 'days')
  const result: DailyJobResult = { presend: 0, fired: 0, variableDrafts: 0, retriesSucceeded: 0, retriesFailedAgain: 0, newFailures: 0 }

  // 1) 24h pre-send notifications — applies to every active template firing tomorrow
  const presendDue = await queryAll<RecurringTemplate>(
    `SELECT * FROM recurring_invoice_templates WHERE status = 'active' AND next_send_date = ? AND (last_presend_notified_date IS NULL OR last_presend_notified_date != ?)`,
    [tomorrow, tomorrow]
  )
  for (const t of presendDue) {
    await notifyPresend(t)
    await execute(`UPDATE recurring_invoice_templates SET last_presend_notified_date = ? WHERE id = ?`, [tomorrow, t.id])
    result.presend++
  }

  // 2) Retries due today — one retry attempt per failure, then auto-pause
  // Selects only t.* (unambiguous "id") plus the log's id under a distinct alias —
  // "SELECT l.*, t.*" would silently collide both tables' "id" columns.
  const retriesDue = await queryAll<AnyRecord>(
    `SELECT t.*, l.id as log_id FROM recurring_invoice_logs l JOIN recurring_invoice_templates t ON t.id = l.template_id
     WHERE l.status = 'failed' AND l.retry_count = 0 AND l.retry_at <= ? AND t.status = 'active'`,
    [today]
  )
  for (const row of retriesDue) {
    const t = row as unknown as RecurringTemplate
    try {
      if (t.amount_mode === 'fixed') await fireFixedTemplate(t)
      else await generateDraftForTemplate(t)
      await execute(`UPDATE recurring_invoice_logs SET status = 'success', sent_at = ?, retry_count = 1 WHERE id = ?`, [new Date().toISOString(), row.log_id])
      result.retriesSucceeded++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await execute(`UPDATE recurring_invoice_logs SET status = 'failed', retry_count = 1, error_message = ? WHERE id = ?`, [msg, row.log_id])
      await execute(`UPDATE recurring_invoice_templates SET status = 'paused', updated_at = ? WHERE id = ?`, [new Date().toISOString(), t.id])
      await notifyFailure(t, msg, false)
      result.retriesFailedAgain++
    }
  }

  // 3) Fixed-amount sends due today (skip templates with an unresolved failure — handled by step 2)
  const fixedDue = await queryAll<RecurringTemplate>(
    `SELECT * FROM recurring_invoice_templates t WHERE t.status = 'active' AND t.amount_mode = 'fixed' AND t.next_send_date = ?
     AND NOT EXISTS (SELECT 1 FROM recurring_invoice_logs l WHERE l.template_id = t.id AND l.status = 'failed' AND l.retry_count = 0)`,
    [today]
  )
  for (const t of fixedDue) {
    try {
      await fireFixedTemplate(t)
      result.fired++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      const retryAt = addFrequency(today, 'custom', 1, 'days')
      await execute(
        `INSERT INTO recurring_invoice_logs (template_id, scheduled_date, status, error_message, retry_count, retry_at, created_at) VALUES (?,?,?,?,?,?,?)`,
        [t.id, today, 'failed', msg, 0, retryAt, new Date().toISOString()]
      )
      await notifyFailure(t, msg, true)
      result.newFailures++
    }
  }

  // 4) Variable-amount drafts generated 48h before send
  const variableDue = await queryAll<RecurringTemplate>(
    `SELECT * FROM recurring_invoice_templates t WHERE t.status = 'active' AND t.amount_mode = 'variable' AND t.next_send_date = ?
     AND NOT EXISTS (SELECT 1 FROM recurring_invoice_logs l WHERE l.template_id = t.id AND l.scheduled_date = t.next_send_date)`,
    [addFrequency(today, 'custom', 2, 'days')]
  )
  for (const t of variableDue) {
    try {
      await generateDraftForTemplate(t)
      result.variableDrafts++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      const retryAt = addFrequency(today, 'custom', 1, 'days')
      await execute(
        `INSERT INTO recurring_invoice_logs (template_id, scheduled_date, status, error_message, retry_count, retry_at, created_at) VALUES (?,?,?,?,?,?,?)`,
        [t.id, t.next_send_date, 'failed', msg, 0, retryAt, new Date().toISOString()]
      )
      await notifyFailure(t, msg, true)
      result.newFailures++
    }
  }

  return result
}
