import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params
  const rows = await queryAll(`SELECT * FROM news_briefings WHERE date = ?`, [date])
  if (rows[0]) return NextResponse.json(rows[0])

  // Generate on the fly if not yet seeded
  const articles = await queryAll(
    `SELECT title, summary, category FROM news_articles ORDER BY published_at DESC LIMIT 8`
  )
  if (!articles.length) {
    return NextResponse.json({ date, content: 'No articles available yet. Check back soon.' })
  }

  const prompt = `Based on these news summaries for independent professionals, write a concise morning briefing (about 150 words). Lead with the most impactful story, mention 2-3 others briefly, and end with a quick hit. Use paragraph breaks. Write in second-person ("you") for relevance. No headers, no bullets — just readable paragraphs.

Articles:
${articles.map((a: Record<string, unknown>) => `[${a.category}] ${a.title}: ${(a.summary as string).slice(0, 120)}...`).join('\n')}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  await execute(
    `INSERT OR IGNORE INTO news_briefings (date, content) VALUES (?, ?)`,
    [date, content]
  )

  return NextResponse.json({ date, content })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params

  const articles = await queryAll(
    `SELECT title, summary, category FROM news_articles ORDER BY published_at DESC LIMIT 8`
  )

  const prompt = `Based on these news summaries for independent professionals, write a concise morning briefing (about 150 words). Lead with the most impactful story, mention 2-3 others briefly, and end with a quick hit. Use paragraph breaks. Write in second-person ("you") for relevance. No headers, no bullets — just readable paragraphs.

Articles:
${articles.map((a: Record<string, unknown>) => `[${a.category}] ${a.title}: ${(a.summary as string).slice(0, 120)}...`).join('\n')}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  await execute(
    `INSERT OR REPLACE INTO news_briefings (date, content, generated_at) VALUES (?, ?, datetime('now'))`,
    [date, content]
  )

  return NextResponse.json({ date, content })
}
