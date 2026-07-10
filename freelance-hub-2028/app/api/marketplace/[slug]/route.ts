import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params
  const row = await queryOne<Record<string, unknown>>(
    `SELECT id, name, slug, description, category, submitted_by_profession, clone_count, average_rating, rating_count, created_at
     FROM marketplace_agents WHERE slug = ? AND approved = 1`,
    [slug]
  )
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}
