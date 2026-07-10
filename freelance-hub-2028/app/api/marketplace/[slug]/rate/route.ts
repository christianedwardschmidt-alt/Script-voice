import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ slug: string }> }

// accepts either a slug or a numeric marketplace_agents.id, so callers that only
// know the id (e.g. the agent detail page, via agents.marketplace_agent_id) work too
async function getMarketplaceId(identifier: string): Promise<number | null> {
  const row = await queryOne<{ id: number }>(
    `SELECT id FROM marketplace_agents WHERE slug = ? OR id = ?`,
    [identifier, identifier]
  )
  return row?.id ?? null
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const marketplaceId = await getMarketplaceId(slug)
  if (!marketplaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await queryOne<{ rating: number }>(
    `SELECT rating FROM marketplace_ratings WHERE marketplace_agent_id = ? AND user_id = ?`,
    [marketplaceId, user.id]
  )
  return NextResponse.json({ rating: existing?.rating ?? null })
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const { rating } = await req.json()
  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: 'Rating must be an integer 1-5' }, { status: 400 })
  }

  const marketplaceId = await getMarketplaceId(slug)
  if (!marketplaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM marketplace_ratings WHERE marketplace_agent_id = ? AND user_id = ?`,
    [marketplaceId, user.id]
  )
  if (existing) {
    await execute(`UPDATE marketplace_ratings SET rating = ? WHERE id = ?`, [r, existing.id])
  } else {
    await execute(
      `INSERT INTO marketplace_ratings (marketplace_agent_id, user_id, rating, created_at) VALUES (?,?,?,?)`,
      [marketplaceId, user.id, r, new Date().toISOString()]
    )
  }

  const agg = await queryOne<{ avg: number; cnt: number }>(
    `SELECT AVG(rating) as avg, COUNT(*) as cnt FROM marketplace_ratings WHERE marketplace_agent_id = ?`,
    [marketplaceId]
  )
  await execute(
    `UPDATE marketplace_agents SET average_rating = ?, rating_count = ? WHERE id = ?`,
    [Math.round((agg?.avg ?? 0) * 10) / 10, Number(agg?.cnt ?? 0), marketplaceId]
  )

  return NextResponse.json({ ok: true })
}
