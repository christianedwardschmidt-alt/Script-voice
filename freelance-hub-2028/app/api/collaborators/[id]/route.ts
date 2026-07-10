import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

async function findMemberIdByEmail(email: string): Promise<number | null> {
  const row = await queryOne<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()])
  return row?.id ?? null
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await queryOne<{ id: number; collaborator_email: string }>(
    `SELECT id, collaborator_email FROM collaborators WHERE id = ? AND owner_user_id = ?`,
    [id, user.id]
  )
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const name = body.name?.trim() ?? undefined
  const email = body.email?.trim()?.toLowerCase() ?? undefined
  const relationship = body.relationship ?? undefined

  const collaboratorUserId = email ? await findMemberIdByEmail(email) : undefined

  const updates: string[] = []
  const args: (string | number | null)[] = []
  if (name !== undefined) { updates.push('collaborator_name = ?'); args.push(name) }
  if (email !== undefined) { updates.push('collaborator_email = ?'); args.push(email); updates.push('collaborator_user_id = ?'); args.push(collaboratorUserId ?? null) }
  if (relationship !== undefined) { updates.push('relationship = ?'); args.push(relationship) }

  if (updates.length) {
    args.push(Number(id), user.id)
    await execute(`UPDATE collaborators SET ${updates.join(', ')} WHERE id = ? AND owner_user_id = ?`, args)
  }

  const row = await queryOne(`SELECT * FROM collaborators WHERE id = ?`, [id])
  return NextResponse.json({ ...row, is_guildwire_member: !!(row as { collaborator_user_id: number | null } | null)?.collaborator_user_id })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`DELETE FROM collaborators WHERE id = ? AND owner_user_id = ?`, [id, user.id])
  return NextResponse.json({ ok: true })
}
