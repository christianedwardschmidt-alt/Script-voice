import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(
    `SELECT * FROM proposals WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  )
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const {
    title = 'Untitled Proposal',
    client_name = '',
    client_email = '',
    client_id = null,
    project_type = 'Consulting',
    valid_until = null,
  } = body

  const share_token = crypto.randomBytes(16).toString('hex')
  const defaultTerms = `1. All work product becomes the property of the client upon receipt of final payment.\n2. The client may request up to 2 rounds of revisions. Additional revisions are billed at the hourly rate.\n3. Either party may cancel with 14 days written notice. Work completed to date will be invoiced.\n4. Late payments incur a 1.5% monthly service fee after 30 days.\n5. This proposal is valid for 30 days from the date sent.`

  const result = await execute(
    `INSERT INTO proposals (user_id,title,client_name,client_email,client_id,project_type,valid_until,share_token,terms,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    [user.id, title, client_name, client_email, client_id, project_type, valid_until, share_token, defaultTerms]
  )
  const id = Number(result.lastInsertRowid)
  const row = await queryAll(`SELECT * FROM proposals WHERE id = ?`, [id])
  return NextResponse.json(row[0], { status: 201 })
}
