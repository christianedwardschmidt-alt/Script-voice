import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // id is the article_id
  await execute(
    `DELETE FROM news_bookmarks WHERE user_id = ? AND article_id = ?`,
    [user.id, id]
  )
  return NextResponse.json({ ok: true })
}
