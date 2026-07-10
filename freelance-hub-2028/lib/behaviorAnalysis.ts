import { queryAll, queryOne, execute } from '@/lib/db'

export type PatternType = 'late_payer' | 'contact_gap' | 'unfollowed_proposal' | 'recurring_manual_task' | 'frequent_meeting_client'

// Patterns keyed on a duration/severity threshold are actionable from a single
// detection — the threshold itself is the signal. Patterns keyed on genuine
// repetition need to actually repeat before we call it a "pattern."
const MIN_OCCURRENCES: Record<PatternType, number> = {
  late_payer: 3,
  contact_gap: 1,
  unfollowed_proposal: 1,
  recurring_manual_task: 3,
  frequent_meeting_client: 3,
}

export interface DetectedPattern {
  patternType: PatternType
  patternKey: string
  occurrenceCount: number
  data: Record<string, unknown>
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function detectLatePayers(userId: number): Promise<DetectedPattern[]> {
  const rows = await queryAll<{ client: string; late_count: number; avg_days_late: number; last_invoice: string; total_late_amount: number }>(
    `SELECT i.client, COUNT(*) as late_count,
            AVG(julianday(p.paid_at) - julianday(i.due)) as avg_days_late,
            MAX(i.id) as last_invoice,
            SUM(i.amount) as total_late_amount
     FROM invoices i
     JOIN invoice_payments p ON p.invoice_id = i.id AND p.user_id = i.user_id
     WHERE i.user_id = ? AND i.due IS NOT NULL AND i.due != '' AND julianday(p.paid_at) > julianday(i.due)
     GROUP BY i.client
     HAVING late_count >= 1`,
    [userId]
  )
  return rows.map(r => ({
    patternType: 'late_payer' as const,
    patternKey: r.client,
    occurrenceCount: r.late_count,
    data: { client: r.client, lateCount: r.late_count, avgDaysLate: Math.round(r.avg_days_late), totalLateAmount: r.total_late_amount },
  }))
}

async function detectContactGaps(userId: number): Promise<DetectedPattern[]> {
  const rows = await queryAll<{ name: string; company: string; lastContact: string; daysSince: number }>(
    `SELECT name, company, lastContact, CAST(julianday('now') - julianday(lastContact) AS INTEGER) as daysSince
     FROM crm_clients
     WHERE user_id = ? AND lastContact IS NOT NULL AND lastContact != '' AND julianday('now') - julianday(lastContact) >= 30`,
    [userId]
  )
  return rows.map(r => ({
    patternType: 'contact_gap' as const,
    patternKey: r.name,
    occurrenceCount: 1,
    data: { client: r.name, company: r.company, daysSinceContact: r.daysSince },
  }))
}

async function detectUnfollowedProposals(userId: number): Promise<DetectedPattern[]> {
  const rows = await queryAll<{ id: number; title: string; client_name: string; sent_at: string; view_count: number; daysSince: number }>(
    `SELECT id, title, client_name, sent_at, view_count, CAST(julianday('now') - julianday(sent_at) AS INTEGER) as daysSince
     FROM proposals
     WHERE user_id = ? AND status IN ('sent','viewed') AND sent_at IS NOT NULL AND julianday('now') - julianday(sent_at) >= 10`,
    [userId]
  )
  return rows.map(r => ({
    patternType: 'unfollowed_proposal' as const,
    patternKey: `proposal-${r.id}`,
    occurrenceCount: 1,
    data: { proposalId: r.id, title: r.title, client: r.client_name, daysSinceSent: r.daysSince, viewCount: r.view_count },
  }))
}

async function detectRecurringManualTasks(userId: number): Promise<DetectedPattern[]> {
  const rows = await queryAll<{ title: string; dueDate: string }>(
    `SELECT title, dueDate FROM tasks WHERE user_id = ? AND dueDate IS NOT NULL AND dueDate != ''`,
    [userId]
  )
  const byTitle = new Map<string, { day: string; date: string }[]>()
  for (const row of rows) {
    const key = row.title.trim().toLowerCase()
    const d = new Date(`${row.dueDate}T00:00:00Z`)
    if (isNaN(d.getTime())) continue
    const day = DAY_NAMES[d.getUTCDay()]
    if (!byTitle.has(key)) byTitle.set(key, [])
    byTitle.get(key)!.push({ day, date: row.dueDate })
  }
  const patterns: DetectedPattern[] = []
  for (const [key, entries] of byTitle) {
    const byDay = new Map<string, Set<string>>()
    for (const e of entries) {
      if (!byDay.has(e.day)) byDay.set(e.day, new Set())
      byDay.get(e.day)!.add(e.date)
    }
    for (const [day, dates] of byDay) {
      if (dates.size >= 3) {
        const originalTitle = rows.find(r => r.title.trim().toLowerCase() === key)?.title || key
        patterns.push({
          patternType: 'recurring_manual_task',
          patternKey: key,
          occurrenceCount: dates.size,
          data: { title: originalTitle, dayOfWeek: day, occurrences: dates.size, dates: Array.from(dates).sort() },
        })
      }
    }
  }
  return patterns
}

async function detectFrequentMeetingClients(userId: number): Promise<DetectedPattern[]> {
  const rows = await queryAll<{ client: string; cnt: number }>(
    `SELECT client, COUNT(*) as cnt FROM calendar_events
     WHERE user_id = ? AND type = 'meeting' AND client IS NOT NULL AND client != ''
     GROUP BY client HAVING cnt >= 1`,
    [userId]
  )
  return rows.map(r => ({
    patternType: 'frequent_meeting_client' as const,
    patternKey: r.client,
    occurrenceCount: r.cnt,
    data: { client: r.client, meetingCount: r.cnt },
  }))
}

export async function detectAllPatterns(userId: number): Promise<DetectedPattern[]> {
  const [late, gaps, proposals, tasks, meetings] = await Promise.all([
    detectLatePayers(userId),
    detectContactGaps(userId),
    detectUnfollowedProposals(userId),
    detectRecurringManualTasks(userId),
    detectFrequentMeetingClients(userId),
  ])
  return [...late, ...gaps, ...proposals, ...tasks, ...meetings]
}

interface PatternRow {
  id: number
  occurrence_count: number
  suggested: number
  suggestion_dismissed: number
}

// Upserts every detected pattern, then returns the subset that has just crossed
// its suggestion threshold and hasn't already been suggested or waved off.
export async function recordPatternsAndFindCandidates(userId: number, patterns: DetectedPattern[]): Promise<DetectedPattern[]> {
  const now = new Date().toISOString()
  const candidates: DetectedPattern[] = []

  for (const p of patterns) {
    const existing = await queryOne<PatternRow>(
      `SELECT id, occurrence_count, suggested, suggestion_dismissed FROM member_behavior_patterns WHERE user_id = ? AND pattern_type = ? AND pattern_key = ?`,
      [userId, p.patternType, p.patternKey]
    )

    if (existing) {
      await execute(
        `UPDATE member_behavior_patterns SET occurrence_count = ?, pattern_data = ?, last_detected = ? WHERE id = ?`,
        [p.occurrenceCount, JSON.stringify(p.data), now, existing.id]
      )
      if (!existing.suggested && !existing.suggestion_dismissed && p.occurrenceCount >= MIN_OCCURRENCES[p.patternType]) {
        candidates.push(p)
      }
    } else {
      await execute(
        `INSERT INTO member_behavior_patterns (user_id,pattern_type,pattern_key,pattern_data,first_detected,last_detected,occurrence_count,suggested,suggestion_dismissed,created_at) VALUES (?,?,?,?,?,?,?,0,0,?)`,
        [userId, p.patternType, p.patternKey, JSON.stringify(p.data), now, now, p.occurrenceCount, now]
      )
      if (p.occurrenceCount >= MIN_OCCURRENCES[p.patternType]) {
        candidates.push(p)
      }
    }
  }

  // A pattern type dismissed 3+ times stops being suggested entirely for this member.
  const dismissedCounts = await queryAll<{ pattern_type: string; cnt: number }>(
    `SELECT pattern_type, COUNT(*) as cnt FROM agent_suggestions WHERE user_id = ? AND dismissed = 1 GROUP BY pattern_type`,
    [userId]
  )
  const blockedTypes = new Set(dismissedCounts.filter(d => d.cnt >= 3).map(d => d.pattern_type))

  return candidates.filter(c => !blockedTypes.has(c.patternType))
}

export async function markPatternSuggested(userId: number, patternType: PatternType, patternKey: string): Promise<void> {
  await execute(
    `UPDATE member_behavior_patterns SET suggested = 1 WHERE user_id = ? AND pattern_type = ? AND pattern_key = ?`,
    [userId, patternType, patternKey]
  )
}
