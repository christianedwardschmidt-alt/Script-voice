import { queryOne, queryAll } from '@/lib/db'

interface InvoiceSummaryRow {
  open_count: number
  open_total: number
  overdue_count: number
}

interface ClientRow {
  name: string
  company: string
  revenue: number
}

interface ProposalRow {
  title: string
  client_name: string
  status: string
  total: number
}

interface TaskCountRow {
  count: number
}

interface SessionRow {
  created_at: string
}

interface UserRow {
  created_at: string
  name: string
}

function dollars(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `$${Math.round(n).toLocaleString()}`
}

const TECHNICAL_KEYWORDS = [
  'engineer', 'engineering', 'developer', 'dev ', 'software', 'backend', 'frontend',
  'fullstack', 'full-stack', 'data scientist', 'data analyst', 'machine learning', 'ml ',
  'architect', 'devops', 'sre', 'security', 'cto', 'vp of eng',
  'consultant', 'consulting', 'strategy', 'strategist', 'management consulting',
  'finance', 'financial', 'accountant', 'cpa', 'cfo', 'analyst', 'quant',
  'operations', 'product manager', 'program manager', 'project manager',
]

const CREATIVE_KEYWORDS = [
  'designer', 'design', 'ux', 'ui ', 'graphic', 'illustrator', 'illustration',
  'photographer', 'photography', 'photo', 'videographer', 'filmmaker', 'video',
  'writer', 'writing', 'copywriter', 'content', 'editorial', 'journalist',
  'creative', 'marketing', 'marketer', 'brand', 'branding', 'social media',
  'artist', 'art director', 'creative director', 'influencer', 'animator',
]

type CommStyle = 'technical' | 'creative' | 'balanced'

function classifyProfession(headline: string): CommStyle {
  const lower = headline.toLowerCase()
  if (TECHNICAL_KEYWORDS.some(k => lower.includes(k))) return 'technical'
  if (CREATIVE_KEYWORDS.some(k => lower.includes(k))) return 'creative'
  return 'balanced'
}

const COMM_STYLE_TEXT: Record<CommStyle, string> = {
  technical:
    'Direct and precise. Assumes high business literacy and familiarity with professional terminology. Does not over-explain standard concepts — skips definitions the member clearly already knows. Respects their time. Confident, specific recommendations without unnecessary hedging. Gets to the point immediately.',

  creative:
    'Warm and encouraging. Explains business, financial, and legal concepts in plain language with relatable real-world examples where helpful. Celebrates their wins. Does not assume prior knowledge of invoicing, contracts, or cash-flow management. Supportive without being condescending — makes the member feel capable and in control, never overwhelmed.',

  balanced:
    'Clear and professional. Explains concepts when context warrants it; skips explanation when the member\'s own language signals they already understand. Mirrors the member\'s communication register back to them. Balanced between warmth and efficiency — reads the room and adjusts.',
}

export async function buildMemberContext(userId: number, fallbackName: string): Promise<string> {
  const todayIso = new Date().toISOString().split('T')[0]
  const weekAheadIso = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]

  const [
    profile,
    topClients,
    invoiceSummary,
    recentProposal,
    taskRow,
    sessions,
    userRow,
    contactInfo,
  ] = await Promise.all([
    queryOne<Record<string, unknown>>(
      `SELECT displayName, headline, skills FROM profile WHERE user_id = ?`,
      [userId]
    ),
    queryAll<ClientRow>(
      `SELECT name, company, revenue FROM clients WHERE user_id = ? ORDER BY revenue DESC LIMIT 3`,
      [userId]
    ),
    queryOne<InvoiceSummaryRow>(
      `SELECT
         COUNT(CASE WHEN status != 'Paid' THEN 1 END)               AS open_count,
         COALESCE(SUM(CASE WHEN status != 'Paid' THEN amount END),0) AS open_total,
         COUNT(CASE WHEN status = 'Overdue' THEN 1 END)              AS overdue_count
       FROM invoices WHERE user_id = ?`,
      [userId]
    ),
    queryOne<ProposalRow>(
      `SELECT title, client_name, status, total FROM proposals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ),
    queryOne<TaskCountRow>(
      `SELECT COUNT(*) AS count FROM tasks
       WHERE user_id = ? AND checked = 0
         AND dueDate != ''
         AND date(dueDate) BETWEEN date(?) AND date(?)`,
      [userId, todayIso, weekAheadIso]
    ),
    // Fetch two most recent sessions to find the *previous* login
    queryAll<SessionRow>(
      `SELECT created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 2`,
      [userId]
    ),
    queryOne<UserRow>(
      `SELECT created_at, name FROM users WHERE id = ?`,
      [userId]
    ),
    queryOne<Record<string, unknown>>(
      `SELECT location, bio FROM contact_info WHERE user_id = ?`,
      [userId]
    ),
  ])

  // ── Identity ─────────────────────────────────────────────────────────────
  const name = (profile?.displayName as string | null) ?? userRow?.name ?? fallbackName
  const profession = (profile?.headline as string | null) ?? 'freelance professional'
  const location = (contactInfo?.location as string | null) ?? null

  let memberSince = 'recently'
  if (userRow?.created_at) {
    const d = new Date(userRow.created_at)
    memberSince = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // ── Last login ────────────────────────────────────────────────────────────
  // sessions[0] is the current session; sessions[1] is the previous login
  let lastLoginLine = ''
  if (sessions.length >= 2) {
    const prev = new Date(sessions[1].created_at)
    const daysDiff = Math.floor((Date.now() - prev.getTime()) / 86_400_000)
    if (daysDiff === 0) lastLoginLine = 'They were last active earlier today.'
    else if (daysDiff === 1) lastLoginLine = 'They were last active yesterday.'
    else lastLoginLine = `They were last active ${daysDiff} days ago.`
  }

  // ── Top clients ───────────────────────────────────────────────────────────
  let clientsLine: string
  if (topClients.length === 0) {
    clientsLine = 'They have no clients on record yet.'
  } else if (topClients.length === 1) {
    const c = topClients[0]
    clientsLine = `Their top client is ${c.name}${c.company ? ` (${c.company})` : ''}, with ${dollars(c.revenue)} billed to date.`
  } else {
    const ranked = topClients.map((c, i) => {
      const label = i === 0 ? 'top client' : i === 1 ? 'second client' : 'third client'
      return `${label}: ${c.name}${c.company ? ` (${c.company})` : ''} at ${dollars(c.revenue)}`
    })
    clientsLine = `Their ${ranked.join(', ')}.`
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  const openCount    = Number(invoiceSummary?.open_count    ?? 0)
  const openTotal    = Number(invoiceSummary?.open_total    ?? 0)
  const overdueCount = Number(invoiceSummary?.overdue_count ?? 0)

  let invoiceLine: string
  if (openCount === 0) {
    invoiceLine = 'All invoices are settled — no outstanding balance.'
  } else {
    invoiceLine = `They have ${openCount} open invoice${openCount !== 1 ? 's' : ''} totalling ${dollars(openTotal)}`
    if (overdueCount > 0) {
      invoiceLine += `, of which ${overdueCount} ${overdueCount === 1 ? 'is' : 'are'} overdue`
    }
    invoiceLine += '.'
  }

  // ── Proposals ─────────────────────────────────────────────────────────────
  let proposalLine: string
  if (!recentProposal) {
    proposalLine = 'No proposals have been created yet.'
  } else {
    const statusLabel = {
      draft: 'still in draft',
      sent: 'sent and awaiting response',
      accepted: 'accepted',
      declined: 'declined',
    }[recentProposal.status] ?? recentProposal.status
    const value = recentProposal.total ? ` (${dollars(Number(recentProposal.total))})` : ''
    proposalLine = `Their most recent proposal — "${recentProposal.title}" for ${recentProposal.client_name || 'a client'}${value} — is ${statusLabel}.`
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const taskCount = Number(taskRow?.count ?? 0)
  const taskLine = taskCount === 0
    ? 'No tasks are due in the next 7 days.'
    : `They have ${taskCount} task${taskCount !== 1 ? 's' : ''} due in the next 7 days.`

  // ── Assemble ──────────────────────────────────────────────────────────────
  const locationPart = location ? `, based in ${location},` : ''
  const commStyle = classifyProfession(profession)

  return `You are the GuildWire AI Companion for ${name}, a ${profession}${locationPart} who has been a member since ${memberSince}.

${clientsLine}
${invoiceLine}
${proposalLine}
${taskLine}${lastLoginLine ? `\n${lastLoginLine}` : ''}

Use this context naturally throughout the conversation. Reference their actual clients, numbers, and business situation when it's relevant — without announcing it or reciting it back. Speak as a trusted business advisor who has been following their work closely and already knows the shape of their business.

Communication style for this member: ${COMM_STYLE_TEXT[commStyle]}. Adjust your tone, vocabulary, and level of explanation accordingly in every response.`
}
