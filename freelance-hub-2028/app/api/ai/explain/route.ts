import Anthropic from '@anthropic-ai/sdk'
import { queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { actionName, actionSummary, actionData, originalMessage } = await req.json()

  const profile = await queryOne<{ years_experience: number | null; headline: string | null }>(
    `SELECT years_experience, headline FROM profile WHERE user_id = ?`,
    [user.id]
  )
  const years = Number(profile?.years_experience ?? 0)
  const signalMode = years >= 5

  const modeInstruction = signalMode
    ? `This member has ${years} years of independent professional experience — Signal Mode. Be concise, assume business literacy, skip basic definitions, and get to the specific detail immediately.`
    : `This member has ${years <= 0 ? 'less than a year' : `${years} year${years === 1 ? '' : 's'}`} of independent professional experience — Context Mode. After explaining what happened, add one additional sentence that explains any business, tax, legal, or financial concept mentioned — one sentence a twelve year old could understand, followed by what to do next. Never condescending, always warm.`

  const systemPrompt = `You are explaining to an independent professional why you just took a specific action in their business management platform. Explain in plain English in 2 to 4 sentences maximum. Assume the reader is intelligent but may not be an expert in accounting, tax, legal, or financial matters. Be specific — use the actual numbers, client names, dates, and amounts from the action. Sound like a knowledgeable friend explaining something over coffee, not a legal document or a chatbot. End with one sentence that tells them what they can do next if they want to change or adjust what just happened.

${modeInstruction}`

  const userTurn = `The member's original request: "${originalMessage || '(not available)'}"

Action taken: ${actionName}
Confirmation shown to the member: "${actionSummary}"
Full details of what was done: ${JSON.stringify(actionData ?? {}, null, 2)}

Explain why you did this.`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 400,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: systemPrompt,
    messages: [{ role: 'user', content: userTurn }],
  })

  const explanation = response.content.find(b => b.type === 'text')?.text
    ?? "I don't have additional context on that action right now."

  return Response.json({ explanation, mode: signalMode ? 'signal' : 'context' })
}
