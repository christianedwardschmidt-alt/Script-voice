import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
    workspaceName: row.workspaceName ?? 'My Studio',
  }
}

export async function GET() {
  const row = await queryOne(`SELECT * FROM settings WHERE id = 1`)
  return NextResponse.json(deserialize(row!))
}

export async function PATCH(request: NextRequest) {
  const existing = await queryOne(`SELECT * FROM settings WHERE id = 1`)
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const boolFields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest']
  for (const f of boolFields) if (body[f] !== undefined) next[f] = body[f] ? 1 : 0
  if (body.workspaceName !== undefined) next.workspaceName = body.workspaceName

  await execute(
    `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=?, workspaceName=? WHERE id=1`,
    [next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName]
  )

  const row = await queryOne(`SELECT * FROM settings WHERE id = 1`)
  return NextResponse.json(deserialize(row!))
}
