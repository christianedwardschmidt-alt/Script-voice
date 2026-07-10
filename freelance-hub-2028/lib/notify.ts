import { execute } from './db'

export async function notify(params: {
  userId: number
  type: string
  title: string
  body: string
  href?: string
  meta?: Record<string, unknown>
}): Promise<void> {
  await execute(
    `INSERT INTO notifications (user_id, type, title, body, href, read, meta, created_at) VALUES (?,?,?,?,?,0,?,?)`,
    [params.userId, params.type, params.title, params.body, params.href ?? '', JSON.stringify(params.meta ?? {}), new Date().toISOString()]
  )
}
