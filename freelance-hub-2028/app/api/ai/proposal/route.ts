import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/auth'

const anthropic = new Anthropic()

const SECTION_PROMPTS: Record<string, (ctx: { clientName: string; projectType: string; title: string }) => string> = {
  introduction: ({ clientName, projectType, title }) =>
    `Write a warm, professional proposal introduction (2-3 paragraphs) for a ${projectType} project called "${title}" for ${clientName || 'the client'}. Express enthusiasm for the project, acknowledge the discovery process, and build confidence that you're the right choice. Tone: confident but personable. No generic phrases like "I am pleased to submit". Be specific to this type of work.`,
  problem: ({ clientName, projectType, title }) =>
    `Write a "The Problem" section (1-2 paragraphs) for a ${projectType} proposal called "${title}" for ${clientName || 'the client'}. Identify the business challenges this type of client typically faces that this project would solve. Be specific and empathetic — show you understand their world. Don't use bullet points, write in flowing paragraphs.`,
  solution: ({ clientName, projectType, title }) =>
    `Write a "The Solution" section (2-3 paragraphs) for a ${projectType} proposal called "${title}" for ${clientName || 'the client'}. Describe your approach and methodology. Highlight what makes your solution distinctive and why it's the right fit. Show strategic thinking, not just task execution. Write in flowing paragraphs.`,
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { section, clientName = '', projectType = 'Consulting', title = '' } = await request.json()
  const promptFn = SECTION_PROMPTS[section]
  if (!promptFn) return NextResponse.json({ error: 'Unknown section' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 600,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: promptFn({ clientName, projectType, title }) }],
  })

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  return NextResponse.json({ text })
}
