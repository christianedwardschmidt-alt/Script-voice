import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'

const anthropic = new Anthropic()

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const agent = await queryOne<{ name: string; template_id: string; trigger_type: string }>(
    `SELECT name, template_id, trigger_type FROM agents WHERE id = ? AND user_id = ?`,
    [id, user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { period, timesRun, previousTimesRun, successRate, timeSavedMinutes, revenueEligible, revenueImpact } = await req.json()

  const agentType = agent.template_id || agent.trigger_type || 'custom'
  const timeSavedLabel = timeSavedMinutes >= 60 ? `${(timeSavedMinutes / 60).toFixed(1)} hrs` : `${timeSavedMinutes} min`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system: 'Based on this agent performance data generate one sentence of genuine business insight for the member. Be specific about what the numbers mean for their business. Sound like a knowledgeable colleague not a system report. If the data is positive celebrate it specifically. If something needs attention flag it constructively.',
      messages: [{
        role: 'user',
        content: `Agent name: ${agent.name}
Agent type: ${agentType}
Period: ${period}
Times run this period: ${timesRun}
Times run previous period: ${previousTimesRun ?? 'no prior data'}
Success rate: ${successRate}%
Time saved: ${timeSavedLabel}
Revenue impact: ${revenueEligible ? `$${revenueImpact.toLocaleString()}` : 'not applicable — not a financial agent'}`,
      }],
    })
    const text = response.content.find(b => b.type === 'text')?.text
    return NextResponse.json({ insight: text ?? null })
  } catch {
    return NextResponse.json({ insight: null })
  }
}
