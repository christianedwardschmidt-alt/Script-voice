import { NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface SuggestionRow {
  id: number
  pattern_type: string
  suggested_agent_name: string
  suggested_agent_description: string
  suggested_agent_config: string
  pattern_basis: string
  impact_estimate: string
  shown_at: string | null
  created_at: string
}

function deserialize(row: SuggestionRow) {
  return { ...row, suggested_agent_config: JSON.parse(row.suggested_agent_config || '{}') }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await queryAll<SuggestionRow>(
    `SELECT * FROM agent_suggestions WHERE user_id = ? AND accepted = 0 AND dismissed = 0 ORDER BY created_at DESC LIMIT 3`,
    [user.id]
  )

  const now = new Date().toISOString()
  const unshown = rows.filter(r => !r.shown_at)
  if (unshown.length) {
    await Promise.all(unshown.map(r => execute(`UPDATE agent_suggestions SET shown_at = ? WHERE id = ?`, [now, r.id])))
  }

  return NextResponse.json(rows.map(deserialize))
}
