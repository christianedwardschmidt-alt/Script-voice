import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM tax_settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ?? { filing_status: 'Single', state: '', entity_type: 'Sole Proprietor', fiscal_year: 'Calendar Year', accountant_email: '' })
}

export async function PUT(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { filing_status, state, entity_type, fiscal_year, accountant_email } = body
  await execute(
    `INSERT INTO tax_settings (user_id, filing_status, state, entity_type, fiscal_year, accountant_email)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       filing_status = excluded.filing_status,
       state = excluded.state,
       entity_type = excluded.entity_type,
       fiscal_year = excluded.fiscal_year,
       accountant_email = excluded.accountant_email`,
    [user.id, filing_status, state, entity_type, fiscal_year, accountant_email]
  )
  return NextResponse.json({ ok: true })
}
