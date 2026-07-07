'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Calendar, Flag, X, Trash2 } from 'lucide-react'

type Priority = 'high' | 'medium' | 'low'
type Status = 'todo' | 'in progress' | 'completed'

interface Task {
  id: number
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate: string
  project: string
  integrations: string[]
  checked: boolean
}

const priorityClass: Record<Priority, string> = {
  high: 'badge badge-high',
  medium: 'badge badge-medium',
  low: 'badge badge-low',
}
const statusClass: Record<Status, string> = {
  'in progress': 'badge badge-inprogress',
  todo: 'badge badge-todo',
  completed: 'badge badge-completed',
}

const IntegrationIcon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    figma: '🎨',
    slack: '💬',
    google: '🔵',
    github: '⚫',
  }
  return (
    <div title={name} style={{ width: 24, height: 24, borderRadius: '50%', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
      {icons[name] || '🔗'}
    </div>
  )
}

const tabs = ['All', 'To Do', 'In Progress', 'Completed']

const emptyForm = { title: '', description: '', priority: 'medium' as Priority, status: 'todo' as Status, dueDate: '', project: '' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'All') return matchSearch
    if (activeTab === 'To Do') return matchSearch && t.status === 'todo'
    if (activeTab === 'In Progress') return matchSearch && t.status === 'in progress'
    if (activeTab === 'Completed') return matchSearch && t.status === 'completed'
    return matchSearch
  })

  const toggle = async (id: number) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const checked = !task.checked
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked, status: checked ? 'completed' : 'todo' } : t))
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked, status: checked ? 'completed' : 'todo' }),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  const deleteTask = async (id: number) => {
    setOpenMenuId(null)
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  const createTask = async () => {
    if (!form.title.trim()) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, integrations: [], checked: false }),
    })
    const created = await res.json()
    setTasks(prev => [created, ...prev])
    setForm(emptyForm)
    setShowModal(false)
  }

  const activeTasks = tasks.filter(t => !t.checked)
  const upcomingDeadlines = activeTasks.slice(0, 3)
  const activeProjects = Object.values(
    activeTasks.reduce((acc, t) => {
      if (!t.project) return acc
      acc[t.project] = acc[t.project] || { name: t.project, tasks: 0 }
      acc[t.project].tasks += 1
      return acc
    }, {} as Record<string, { name: string; tasks: number }>)
  )

  return (
    <div className="page-pad" style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Tasks</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Manage your work and stay organized</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          New Task
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#1c1917' }}>{tasks.length}</span>
        <span style={{ fontSize: 14, color: '#78716c', marginLeft: 6 }}>Total Tasks</span>
      </div>

      <div className="g-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left — task list */}
        <div>
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
              <input
                className="search-input"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-outline">
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading && (
              <div style={{ padding: 24, fontSize: 13, color: '#78716c' }}>Loading tasks...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 24, fontSize: 13, color: '#78716c' }}>No tasks found.</div>
            )}
            {filtered.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  background: task.checked ? '#fafafa' : '#fff',
                  position: 'relative',
                }}
              >
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => toggle(task.id)}
                  style={{ width: 16, height: 16, accentColor: '#16a34a', marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: task.checked ? '#9ca3af' : '#111827',
                    textDecoration: task.checked ? 'line-through' : 'none', marginBottom: 4,
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#78716c', marginBottom: 10 }}>{task.description}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={priorityClass[task.priority]}>
                      <Flag size={9} /> {task.priority}
                    </span>
                    <span className={statusClass[task.status]}>{task.status}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#78716c' }}>
                      <Calendar size={11} /> {task.dueDate}
                    </span>
                    <span style={{ fontSize: 12, color: '#78716c' }}>{task.project}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {task.integrations.map(integ => (
                    <IntegrationIcon key={integ} name={integ} />
                  ))}
                  <div style={{ position: 'relative' }}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', marginLeft: 4, padding: 4 }}
                      onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === task.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: 28, background: 'var(--card)',
                        border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 10, minWidth: 130,
                      }}>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13 }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upcoming Deadlines */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1c1917' }}>Upcoming Deadlines</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingDeadlines.length === 0 && (
                <div style={{ fontSize: 13, color: '#78716c' }}>No upcoming deadlines.</div>
              )}
              {upcomingDeadlines.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < upcomingDeadlines.length - 1 ? 12 : 0, borderBottom: i < upcomingDeadlines.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: '#78716c' }}>{d.dueDate}</div>
                  </div>
                  <span className={priorityClass[d.priority]}>{d.priority}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1c1917', marginBottom: 14 }}>Active Projects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeProjects.length === 0 && (
                <div style={{ fontSize: 13, color: '#78716c' }}>No active projects.</div>
              )}
              {activeProjects.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < activeProjects.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1917' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{p.tasks} active task{p.tasks > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div className="card modal-card" style={{ width: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#1c1917' }}>New Task</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="search-input"
                placeholder="Task title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="search-input"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="search-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select className="search-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                  <option value="todo">To Do</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="search-input"
                  placeholder="Due date (e.g. Jan 14)"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
                <input
                  className="search-input"
                  placeholder="Project"
                  value={form.project}
                  onChange={e => setForm({ ...form, project: e.target.value })}
                />
              </div>
              <button className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }} onClick={createTask}>
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
