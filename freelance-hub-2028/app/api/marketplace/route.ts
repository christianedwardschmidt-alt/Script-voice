import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

interface MarketplaceRow {
  id: number
  name: string
  slug: string
  description: string
  category: string
  configuration: string
  submitted_by_profession: string
  clone_count: number
  average_rating: number
  rating_count: number
  created_at: string
}

export async function GET() {
  const rows = await queryAll<MarketplaceRow>(
    `SELECT id, name, slug, description, category, configuration, submitted_by_profession, clone_count, average_rating, rating_count, created_at
     FROM marketplace_agents WHERE approved = 1 ORDER BY created_at DESC`
  )

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const topClones = await queryAll<{ marketplace_agent_id: number; count: number }>(
    `SELECT marketplace_agent_id, COUNT(*) as count FROM marketplace_clone_events
     WHERE created_at >= ? GROUP BY marketplace_agent_id ORDER BY count DESC LIMIT 3`,
    [weekAgo]
  )
  const featuredIds = new Set(topClones.map(t => t.marketplace_agent_id))

  const agents = rows.map(r => ({
    ...r,
    configuration: r.configuration ? JSON.parse(r.configuration) : {},
    featured: featuredIds.has(r.id),
  }))

  return NextResponse.json(agents)
}
