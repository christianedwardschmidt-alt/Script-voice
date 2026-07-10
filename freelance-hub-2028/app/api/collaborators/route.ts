import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface CollaboratorRow {
  id: number
  owner_user_id: number
  collaborator_name: string
  collaborator_email: string
  collaborator_user_id: number | null
  relationship: string
  created_at: string
}

async function findMemberIdByEmail(email: string): Promise<number | null> {
  const row = await queryOne<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()])
  return row?.id ?? null
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await queryAll<CollaboratorRow>(
    `SELECT * FROM collaborators WHERE owner_user_id = ? ORDER BY created_at DESC`,
    [user.id]
  )

  // reconcile any collaborator who has since joined GuildWire
  for (const row of rows) {
    if (!row.collaborator_user_id) {
      const memberId = await findMemberIdByEmail(row.collaborator_email)
      if (memberId) {
        await execute(`UPDATE collaborators SET collaborator_user_id = ? WHERE id = ?`, [memberId, row.id])
        row.collaborator_user_id = memberId
      }
    }
  }

  return NextResponse.json(rows.map(r => ({ ...r, is_guildwire_member: !!r.collaborator_user_id })))
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, relationship } = await req.json()
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const collaboratorUserId = await findMemberIdByEmail(email.trim())
  const now = new Date().toISOString()
  const result = await execute(
    `INSERT INTO collaborators (owner_user_id,collaborator_name,collaborator_email,collaborator_user_id,relationship,created_at) VALUES (?,?,?,?,?,?)`,
    [user.id, name.trim(), email.trim().toLowerCase(), collaboratorUserId, relationship || 'Other', now]
  )

  const row = await queryOne<CollaboratorRow>(`SELECT * FROM collaborators WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json({ ...row, is_guildwire_member: !!row?.collaborator_user_id }, { status: 201 })
}
