import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json({ answer: '' })

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: `You are LanceFlo AI, a sharp assistant for freelancers. Answer in 2–4 sentences max. Be specific and direct. Use **bold** sparingly for key terms. Today is ${today}.`,
    messages: [{ role: 'user', content: q }],
  })

  const text = message.content.find(b => b.type === 'text')?.text ?? ''
  return NextResponse.json({ answer: text })
}
