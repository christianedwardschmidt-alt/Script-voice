import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
  }
}

export async function GET() {
  const row = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}

export async function PATCH(request: NextRequest) {
  const existing = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Record<string, unknown>
  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  const fields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest']
  for (const f of fields) if (body[f] !== undefined) next[f] = body[f] ? 1 : 0

  db.prepare(
    `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=? WHERE id=1`
  ).run(next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest)

  const row = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}
