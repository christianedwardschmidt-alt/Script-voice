import Anthropic from '@anthropic-ai/sdk'
import { queryAll, queryOne } from '@/lib/db'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const { messages } = await req.json()

  const [profile, clients, tasks, invoices] = await Promise.all([
    queryOne(`SELECT displayName, email, headline, skills FROM profile WHERE id = 1`),
    queryAll(`SELECT name, company, status, revenue FROM clients LIMIT 10`),
    queryAll(`SELECT title, status, priority, dueDate, project FROM tasks WHERE checked = 0 LIMIT 10`),
    queryAll(`SELECT id, client, amount, status FROM invoices LIMIT 10`),
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const p = profile as Record<string, unknown> | null
  const clientList = (clients as Record<string, unknown>[])
    .map(c => `• ${c.name} at ${c.company} — ${c.status}, $${Number(c.revenue).toLocaleString()} revenue`)
    .join('\n') || '(none yet)'
  const taskList = (tasks as Record<string, unknown>[])
    .map(t => `• ${t.title} [${t.status}, ${t.priority} priority, due ${t.dueDate}] — ${t.project}`)
    .join('\n') || '(none)'
  const invoiceList = (invoices as Record<string, unknown>[])
    .map(i => `• ${i.id}: ${i.client} — $${Number(i.amount).toLocaleString()} (${i.status})`)
    .join('\n') || '(none)'

  const systemPrompt = `You are LanceFlo AI, a highly capable business assistant for freelance professionals. You help with proposals, project pricing, contracts, client communication, tax planning, and business strategy.

FREELANCER PROFILE:
Name: ${p?.displayName ?? 'Freelancer'}
Skills: ${p?.skills ?? 'Design, Development'}
Email: ${p?.email ?? ''}
Headline: ${p?.headline ?? ''}

ACTIVE CLIENTS:
${clientList}

OPEN TASKS:
${taskList}

INVOICES:
${invoiceList}

Today: ${today}

Instructions:
- Be direct, specific, and actionable. Reference this freelancer's actual clients and projects when relevant.
- When drafting documents (proposals, emails, contracts), write the full professional document, not an outline.
- Format responses clearly: use **Bold Headers** for sections, • bullet points for lists.
- For financial questions, give real numbers and calculations.
- Keep responses focused and practical — no generic filler.`

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
