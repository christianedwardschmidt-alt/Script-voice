import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/auth'
import { buildMemberContext } from '@/lib/memberContext'

const anthropic = new Anthropic()

function timeSlot(hour: number, dayOfWeek: number): string {
  // dayOfWeek: 0=Sun, 1=Mon, 2=Tue … 6=Sat
  if (hour >= 6 && hour < 10) {
    if (dayOfWeek === 1) return 'monday_morning'
    if (dayOfWeek >= 2 && dayOfWeek <= 4) return 'weekday_morning'
    if (dayOfWeek === 5) return 'friday_morning'
  }
  if (hour >= 10 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18) return 'evening'
  return 'general'
}

const SLOT_INSTRUCTIONS: Record<string, string> = {
  monday_morning:
    "It's Monday morning. Write an opening that orients the member toward the week ahead — mention tasks due this week, invoices that need to go out, or a proposal worth following up on. Focused, forward-looking energy.",

  weekday_morning:
    "It's a Tuesday, Wednesday, or Thursday morning. Focus on what's actively in progress right now — what needs attention today, what's in the pipeline. Energetic and on-task.",

  friday_morning:
    "It's Friday morning. Focus on wrapping up well — what's still outstanding, what to collect before the weekend, what they should feel good about finishing today. Slightly motivating.",

  midday:
    "It's midday. Brief check-in energy — acknowledge what the morning may have held, then pivot cleanly to what's next this afternoon. Efficient and practical.",

  afternoon:
    "It's afternoon. Help them close out the day with focus — what to finish today versus what can safely wait. Calm, prioritising tone.",

  evening:
    "It's evening. Lighter and more reflective. Touch on what's set up well for tomorrow or the week ahead — no urgency, more of a thoughtful wind-down. Maybe a weekly summary angle.",

  general:
    "Standard check-in. Focus on whatever is most pressing in their business data — the most actionable thing in front of them right now.",
}

export async function GET() {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const memberContext = await buildMemberContext(user.id, user.name)

  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const slot = timeSlot(hour, day)
  const slotInstruction = SLOT_INSTRUCTIONS[slot]

  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const system = `${memberContext}

---

Current time: ${timeStr} on ${dayStr}.

${slotInstruction}

Write a warm, professional opening message for this member's AI session. Hard rules:
- 2–3 sentences only — no more
- Reference at least one specific real data point (a client name, an invoice count or amount, a proposal title or status, a task count — something concrete from their business)
- Do NOT open with generic openers like "Hi!", "Hello!", or "Good morning!" as standalone phrases — weave the greeting into something specific and relevant immediately
- No bullet points, no headers — natural conversational prose
- Tone: a trusted business colleague who has been following their work closely, not a customer service bot
- Never announce that you have their data or that you've been reviewing it — just demonstrate it naturally`

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 200,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system,
    messages: [{ role: 'user', content: 'Begin.' }],
  })

  const text =
    msg.content.find(b => b.type === 'text')?.text?.trim() ??
    "Good to see you — what would you like to tackle today?"

  return Response.json({ text })
}
