import { NextResponse } from 'next/server'
import { queryOne, seedExtras } from '@/lib/db'
import { getUser, isAdmin } from '@/lib/auth'
import { VERUNO_DEMO_EMAIL } from '@/lib/brandPreviewConstants'

// Backfill for the Veruno demo account specifically — it signed up before
// seedUserData() included agents/notes/proposals, so those tables are
// still empty for it even though new signups now get them automatically.
// Safe to call more than once: seedExtras() checks each of the three
// independently, so it only (re-)seeds whichever part is still missing.
export async function POST() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const demoUser = await queryOne<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [VERUNO_DEMO_EMAIL])
  if (!demoUser) return NextResponse.json({ error: 'Veruno demo account not found.' }, { status: 404 })

  const result = await seedExtras(demoUser.id)
  const skipped = !result.agents && !result.notes && !result.proposals
  return NextResponse.json({ ok: true, skipped, seeded: result })
}
