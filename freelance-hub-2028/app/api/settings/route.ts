import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { DEFAULT_PIPELINE_STAGES } from '@/lib/db'
import { getUser } from '@/lib/auth'

const DEFAULT_STAGES = JSON.parse(DEFAULT_PIPELINE_STAGES)

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
    workspaceName: row.workspaceName ?? 'My Studio',
    pipeline_stages: row.pipeline_stages
      ? JSON.parse(row.pipeline_stages as string)
      : DEFAULT_STAGES,
  }
}

const defaults = {
  notifications: true, twoFactor: false, darkMode: false,
  invoiceAutoSend: true, weeklyDigest: true, workspaceName: 'My Studio',
  pipeline_stages: DEFAULT_STAGES,
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ? deserialize(row) : defaults)
}

interface SettingsRow {
  notifications: number; twoFactor: number; darkMode: number;
  invoiceAutoSend: number; weeklyDigest: number; workspaceName: string; pipeline_stages: string;
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await queryOne<SettingsRow>(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  const body = await request.json()

  const next: SettingsRow = existing
    ? { ...existing }
    : { notifications: 1, twoFactor: 0, darkMode: 0, invoiceAutoSend: 1, weeklyDigest: 1, workspaceName: 'My Studio', pipeline_stages: DEFAULT_PIPELINE_STAGES }

  const boolFields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest'] as const
  for (const f of boolFields) if (body[f] !== undefined) (next as unknown as Record<string, number>)[f] = body[f] ? 1 : 0
  if (body.workspaceName !== undefined) next.workspaceName = body.workspaceName
  if (body.pipeline_stages !== undefined) next.pipeline_stages = JSON.stringify(body.pipeline_stages)

  if (existing) {
    await execute(
      `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=?, workspaceName=?, pipeline_stages=? WHERE user_id=?`,
      [next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName, next.pipeline_stages, user.id]
    )
  } else {
    await execute(
      `INSERT INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName,pipeline_stages) VALUES (?,?,?,?,?,?,?,?)`,
      [user.id, next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName, next.pipeline_stages]
    )
  }

  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(deserialize(row!))
}
