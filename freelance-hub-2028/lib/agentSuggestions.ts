import Anthropic from '@anthropic-ai/sdk'
import { queryAll, queryOne, execute } from '@/lib/db'
import { buildMemberContext } from '@/lib/memberContext'
import { detectAllPatterns, recordPatternsAndFindCandidates, markPatternSuggested, type DetectedPattern } from '@/lib/behaviorAnalysis'

const anthropic = new Anthropic()

interface AgentConfigTemplate {
  icon: string
  trigger_type: string
  actions: unknown[]
  schedule_type?: string
  recurring_config?: Record<string, unknown>
  calendar_trigger_config?: Record<string, unknown>
}

function agentConfigForPattern(pattern: DetectedPattern, timezone: string): AgentConfigTemplate {
  switch (pattern.patternType) {
    case 'late_payer':
      return {
        icon: 'Bell',
        trigger_type: 'invoice-overdue',
        actions: [{ id: 'a1', type: 'send-email', config: { tone: 'firm' } }],
      }
    case 'contact_gap':
      return {
        icon: 'UserPlus',
        trigger_type: '',
        schedule_type: 'recurring',
        recurring_config: { frequency: 'weekly', time: '09:00', days: ['Monday'], timezone },
        actions: [{
          id: 'a1', type: 'rule',
          rule: { conditionType: 'days-since-contact', operator: 'gt', value: '30', ifActions: [{ id: 'if1', type: 'create-task', config: {} }], elseActions: [] },
        }],
      }
    case 'unfollowed_proposal':
      return {
        icon: 'Send',
        trigger_type: 'proposal-sent',
        actions: [
          { id: 'a1', type: 'wait', config: { days: '10' } },
          { id: 'a2', type: 'send-email', config: { tone: 'check-in' } },
        ],
      }
    case 'recurring_manual_task': {
      const day = (pattern.data.dayOfWeek as string) || 'Monday'
      return {
        icon: 'CheckSquare',
        trigger_type: '',
        schedule_type: 'recurring',
        recurring_config: { frequency: 'weekly', time: '09:00', days: [day], timezone },
        actions: [{ id: 'a1', type: 'create-task', config: {} }],
      }
    }
    case 'frequent_meeting_client':
      return {
        icon: 'CalendarClock',
        trigger_type: '',
        schedule_type: 'calendar',
        calendar_trigger_config: { beforeAfter: 'before', offsetMinutes: 60, eventFilter: 'client', clientName: pattern.data.client as string },
        actions: [{ id: 'a1', type: 'send-email', config: { tone: 'prep', note: 'Prep notes to self before the meeting' } }],
      }
  }
}

const PATTERN_LABELS: Record<DetectedPattern['patternType'], string> = {
  late_payer: 'a client who consistently pays invoices late',
  contact_gap: "a client who hasn't been contacted in over 30 days",
  unfollowed_proposal: 'a proposal sent 10+ days ago with no follow-up',
  recurring_manual_task: 'a task the member recreates manually on the same day every week',
  frequent_meeting_client: 'a client the member meets with unusually often',
}

interface ClaudeSuggestion {
  agentName: string
  description: string
  whyCard: string
  impactEstimate: string
}

async function askClaudeForSuggestion(
  pattern: DetectedPattern, memberContext: string
): Promise<ClaudeSuggestion | null> {
  const system = `${memberContext}

---

An independent professional uses GuildWire. Based on the following behavioral pattern in their account, generate a specific agent template suggestion that would save them time or recover money. The suggestion should feel like it was written by a knowledgeable colleague who noticed something the member might have missed — not an algorithm that detected a pattern. Never say "our system detected." Always say "I noticed" or phrase it as a direct observation. Be specific to their actual data, never generic.

Pattern identified: ${PATTERN_LABELS[pattern.patternType]}
Relevant data points: ${JSON.stringify(pattern.data)}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"agentName": "a specific, human agent name (not generic)", "description": "one plain English sentence describing what the agent does", "whyCard": "1-2 sentences, first person as the colleague-voice AI, explaining specifically why THIS member would benefit based on their actual pattern data above — use real names/numbers from the data points", "impactEstimate": "a short phrase like 'Est. saves 2 hours/month' or 'Est. recovers $800/month'"}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system,
      messages: [{ role: 'user', content: 'Generate the suggestion.' }],
    })
    const text = response.content.find(b => b.type === 'text')?.text
    if (!text) return null
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (!parsed.agentName || !parsed.whyCard) return null
    return {
      agentName: parsed.agentName,
      description: parsed.description || '',
      whyCard: parsed.whyCard,
      impactEstimate: parsed.impactEstimate || '',
    }
  } catch {
    return null
  }
}

export async function generateSuggestionForPattern(
  userId: number, userName: string, timezone: string, pattern: DetectedPattern
): Promise<boolean> {
  const memberContext = await buildMemberContext(userId, userName)
  const claudeResult = await askClaudeForSuggestion(pattern, memberContext)
  if (!claudeResult) return false

  const configTemplate = agentConfigForPattern(pattern, timezone)
  const now = new Date().toISOString()

  await execute(
    `INSERT INTO agent_suggestions (user_id,pattern_type,suggested_agent_name,suggested_agent_description,suggested_agent_config,pattern_basis,impact_estimate,created_at) VALUES (?,?,?,?,?,?,?,?)`,
    [
      userId, pattern.patternType, claudeResult.agentName, claudeResult.description,
      JSON.stringify(configTemplate), claudeResult.whyCard, claudeResult.impactEstimate, now,
    ]
  )
  await markPatternSuggested(userId, pattern.patternType, pattern.patternKey)
  return true
}

const MAX_SUGGESTIONS_PER_RUN = 3
const MIN_ACCOUNT_AGE_DAYS = 30

interface EligibleUserRow { id: number; name: string }

export async function analyzeMemberBehavior(userId: number, userName: string): Promise<{ patternsFound: number; suggestionsCreated: number }> {
  const contact = await queryOne<{ timezone: string | null }>(`SELECT timezone FROM contact_info WHERE user_id = ?`, [userId])
  const timezone = contact?.timezone || 'UTC'

  const patterns = await detectAllPatterns(userId)
  const candidates = await recordPatternsAndFindCandidates(userId, patterns)
  const prioritized = candidates.sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, MAX_SUGGESTIONS_PER_RUN)

  let created = 0
  for (const candidate of prioritized) {
    const ok = await generateSuggestionForPattern(userId, userName, timezone, candidate)
    if (ok) created++
  }
  return { patternsFound: patterns.length, suggestionsCreated: created }
}

export async function runWeeklyBehaviorAnalysis(): Promise<{ usersAnalyzed: number; suggestionsCreated: number }> {
  const cutoff = new Date(Date.now() - MIN_ACCOUNT_AGE_DAYS * 86400000).toISOString()
  const users = await queryAll<EligibleUserRow>(`SELECT id, name FROM users WHERE created_at <= ?`, [cutoff])

  let usersAnalyzed = 0
  let suggestionsCreated = 0
  for (const user of users) {
    const result = await analyzeMemberBehavior(user.id, user.name)
    usersAnalyzed++
    suggestionsCreated += result.suggestionsCreated
  }
  return { usersAnalyzed, suggestionsCreated }
}
