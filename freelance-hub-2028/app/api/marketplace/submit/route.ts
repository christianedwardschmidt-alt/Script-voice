import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'agent'
  let slug = base
  let n = 2
  while (await queryOne(`SELECT id FROM marketplace_agents WHERE slug = ?`, [slug])) {
    slug = `${base}-${n}`
    n++
  }
  return slug
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agentId, name, category, description, confirmed } = await req.json()

  if (!confirmed) {
    return NextResponse.json({ error: 'Please confirm the agent has been anonymized.' }, { status: 400 })
  }
  if (!name?.trim() || !category?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Name, category and description are required.' }, { status: 400 })
  }
  if (description.length > 80) {
    return NextResponse.json({ error: 'Description must be 80 characters or fewer.' }, { status: 400 })
  }

  const agent = await queryOne<Record<string, unknown>>(
    `SELECT * FROM agents WHERE id = ? AND user_id = ?`,
    [agentId, user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const configuration = JSON.stringify({
    icon: agent.icon,
    trigger_type: agent.trigger_type,
    conditions: agent.conditions ? JSON.parse(agent.conditions as string) : [],
    actions: agent.actions ? JSON.parse(agent.actions as string) : [],
  })

  const profile = await queryOne<{ headline: string | null }>(`SELECT headline FROM profile WHERE user_id = ?`, [user.id])
  const profession = profile?.headline?.trim() || 'Independent Professional'

  const slug = await uniqueSlug(name.trim())
  const now = new Date().toISOString()

  const result = await execute(
    `INSERT INTO marketplace_agents
      (original_agent_id,name,slug,description,category,configuration,submitted_by_user_id,submitted_by_profession,clone_count,average_rating,rating_count,approved,featured,created_at)
      VALUES (?,?,?,?,?,?,?,?,0,0,0,0,0,?)`,
    [Number(agentId), name.trim(), slug, description.trim(), category.trim(), configuration, user.id, profession, now]
  )

  await execute(
    `INSERT INTO notifications (user_id,type,title,body,href,created_at) VALUES (?,?,?,?,?,?)`,
    [user.id, 'marketplace_submitted', 'Agent submitted for review', "Your agent has been submitted for review. We'll notify you when it goes live.", '/agents', now]
  )

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid), slug })
}
