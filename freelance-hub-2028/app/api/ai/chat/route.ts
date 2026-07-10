import Anthropic from '@anthropic-ai/sdk'
import { queryAll, queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { buildMemberContext } from '@/lib/memberContext'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, voiceMode } = await req.json()

  // Fetch supporting context for instructions; member identity built by buildMemberContext
  const [tasks, invoices, memberContext] = await Promise.all([
    queryAll(
      `SELECT title, status, priority, dueDate, project FROM tasks WHERE user_id = ? AND checked = 0 LIMIT 10`,
      [user.id]
    ),
    queryAll(
      `SELECT id, client, amount, status FROM invoices WHERE user_id = ? LIMIT 10`,
      [user.id]
    ),
    buildMemberContext(user.id, user.name),
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const taskList = (tasks as Record<string, unknown>[])
    .map(t => `• ${t.title} [${t.status}, ${t.priority} priority, due ${t.dueDate}] — ${t.project}`)
    .join('\n') || '(none)'

  const invoiceList = (invoices as Record<string, unknown>[])
    .map(i => `• ${i.id}: ${i.client} — $${Number(i.amount).toLocaleString()} (${i.status})`)
    .join('\n') || '(none)'

  const voiceModeInstruction = voiceMode
    ? `\n\nVOICE MODE: The member is using voice mode. Keep all responses to 2–4 sentences maximum. Be conversational and natural. Avoid lists, bullet points, headers, asterisks, or any formatting that does not translate to spoken audio. Speak as you would in a natural conversation — never as written prose.`
    : `\n- Format responses clearly: use **Bold Headers** for sections, • bullet points for lists.`

  const systemPrompt = `${memberContext}

---

You are GuildWire AI, a highly capable business assistant for freelance professionals. You help with proposals, project pricing, contracts, client communication, tax planning, and business strategy.

OPEN TASKS:
${taskList}

INVOICES:
${invoiceList}

Today: ${today}

Instructions:
- Be direct, specific, and actionable. Reference this freelancer's actual clients and projects when relevant.
- When drafting documents (proposals, emails, contracts), write the full professional document, not an outline.
- For financial questions, give real numbers and calculations.
- Keep responses focused and practical — no generic filler.${voiceModeInstruction}`

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            'delta' in event &&
            (event.delta as { type: string }).type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode((event.delta as { text: string }).text))
          }
        }
      } finally {
        controller.close()
      }
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
