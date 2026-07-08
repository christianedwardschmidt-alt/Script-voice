import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import TasksClient, { type Task } from './TasksClient'

export default async function TasksPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const rows = await queryAll<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC`,
    [user.id]
  )

  const tasks: Task[] = rows.map(row => ({
    id: Number(row.id),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    priority: (String(row.priority ?? 'medium')) as Task['priority'],
    status: (String(row.status ?? 'todo')) as Task['status'],
    dueDate: String(row.dueDate ?? ''),
    project: String(row.project ?? ''),
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    checked: !!row.checked,
  }))

  return <TasksClient initialTasks={tasks} />
}
