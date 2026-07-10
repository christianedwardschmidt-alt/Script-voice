import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { queryAll, queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'

const anthropic = new Anthropic()

interface SettingsRow { work_start: string | null; work_end: string | null; work_days: string | null }
interface EventRow { date: string; startTime: string | null; type: string }

async function calendarPatternSummary(userId: number): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const events = await queryAll<EventRow>(
    `SELECT date, startTime, type FROM calendar_events WHERE user_id = ? AND date >= ? ORDER BY date ASC LIMIT 40`,
    [userId, today]
  )
  if (events.length === 0) return 'No upcoming calendar events on file.'
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const byDay: Record<string, number> = {}
  for (const e of events) {
    const day = dayNames[new Date(`${e.date}T00:00:00Z`).getUTCDay()]
    byDay[day] = (byDay[day] || 0) + 1
  }
  const busiest = Object.entries(byDay).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([d]) => d)
  return `Has ${events.length} upcoming calendar events, most concentrated on ${busiest.join(' and ')}.`
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const description = String(body.description || '').trim()
  if (!description) return NextResponse.json({ error: 'Describe what you want this agent to do first.' }, { status: 400 })

  const settings = await queryOne<SettingsRow>(`SELECT work_start, work_end, work_days FROM settings WHERE user_id = ?`, [user.id])
  const workStart = settings?.work_start || '09:00'
  const workEnd = settings?.work_end || '18:00'
  const workDays: string[] = settings?.work_days ? JSON.parse(settings.work_days) : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const calendarSummary = await calendarPatternSummary(user.id)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system: 'You are helping an independent professional schedule an automated business agent inside GuildWire. Recommend the single best schedule for their goal. Respond with ONLY a JSON object, no other text, in exactly this shape: {"frequency":"daily"|"weekly"|"monthly","time":"HH:MM" (24-hour),"days":["Monday",...] (only if frequency is weekly, otherwise omit),"dayOfMonth":1-31 (only if frequency is monthly, otherwise omit),"explanation":"one warm, specific sentence explaining why this timing fits their situation"}',
      messages: [{
        role: 'user',
        content: `An independent professional uses GuildWire to manage their business. They want an agent that does the following: ${description}. Based on their working hours (${workStart}–${workEnd}, ${workDays.join('/')}), their typical calendar pattern (${calendarSummary}), and the nature of this task, suggest the optimal schedule.`,
      }],
    })
    const text = response.content.find(b => b.type === 'text')?.text
    if (!text) return NextResponse.json({ suggestion: null })
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ suggestion: null })
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      suggestion: {
        frequency: parsed.frequency || 'weekly',
        time: parsed.time || '09:00',
        days: Array.isArray(parsed.days) ? parsed.days : undefined,
        dayOfMonth: typeof parsed.dayOfMonth === 'number' ? parsed.dayOfMonth : undefined,
        explanation: parsed.explanation || '',
      },
    })
  } catch {
    return NextResponse.json({ suggestion: null })
  }
}
