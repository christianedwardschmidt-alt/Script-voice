'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Calendar, Flag, Code, MessageSquare } from 'lucide-react'

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

const initialTasks: Task[] = [
  {
    id: 1, title: 'Complete website redesign mockups',
    description: 'Create high-fidelity mockups for the client homepage and product pages',
    priority: 'high', status: 'in progress', dueDate: 'Jan 14', project: 'Tech Trophey Website',
    integrations: ['figma', 'slack', 'google'], checked: false,
  },
  {
    id: 2, title: 'Review frontend code pull request',
    description: 'Check the new React components for best practices',
    priority: 'medium', status: 'todo', dueDate: 'Jan 12', project: 'Hencewood Digital',
    integrations: ['github', 'slack'], checked: false,
  },
  {
    id: 3, title: 'Client meeting - Project kickoff',
    description: 'Discuss project scope and timeline with new client',
    priority: 'high', status: 'todo', dueDate: 'Jan 11', project: 'Margono Studio',
    integrations: ['slack'], checked: false,
  },
  {
    id: 4, title: 'Update portfolio website',
    description: 'Add recent case studies and update project showcase',
    priority: 'low', status: 'todo', dueDate: 'Jan 20', project: 'Personal',
    integrations: [], checked: false,
  },
]

const upcomingDeadlines = [
  { title: 'Complete website redesign mockups', date: 'Jan 14', priority: 'high' as Priority },
  { title: 'Review frontend code pull request', date: 'Jan 12', priority: 'medium' as Priority },
  { title: 'Client meeting - Project kickoff', date: 'Jan 11', priority: 'high' as Priority },
]

const activeProjects = [
  { name: 'Tech Trophey Website', tasks: 1 },
  { name: 'Hencewood Digital', tasks: 1 },
  { name: 'Margono Studio', tasks: 1 },
]

const priorityClass: Record<Priority, string> = {
  high: 'badge badge-high',
  medium: 'badge badge-medium',
  low: 'badge badge-low',
}
const priorityDeadlineClass: Record<Priority, string> = {
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
    <div title={name} style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
      {icons[name] || '🔗'}
    </div>
  )
}

const tabs = ['All', 'To Do', 'In Progress', 'Completed']

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'All') return matchSearch
    if (activeTab === 'To Do') return matchSearch && t.status === 'todo'
    if (activeTab === 'In Progress') return matchSearch && t.status === 'in progress'
    if (activeTab === 'Completed') return matchSearch && t.status === 'completed'
    return matchSearch
  })

  const toggle = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t))
  }

  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Tasks</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>Manage your work and stay organized</p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          New Task
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{tasks.length}</span>
        <span style={{ fontSize: 14, color: '#9ca3af', marginLeft: 6 }}>Total Tasks</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left — task list */}
        <div>
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
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
            {filtered.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: task.checked ? '#fafafa' : '#fff',
                }}
              >
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => toggle(task.id)}
                  style={{ width: 16, height: 16, accentColor: '#7c3aed', marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: task.checked ? '#9ca3af' : '#111827',
                    textDecoration: task.checked ? 'line-through' : 'none', marginBottom: 4,
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10 }}>{task.description}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={priorityClass[task.priority]}>
                      <Flag size={9} /> {task.priority}
                    </span>
                    <span className={statusClass[task.status]}>{task.status}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <Calendar size={11} /> {task.dueDate}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{task.project}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {task.integrations.map(integ => (
                    <IntegrationIcon key={integ} name={integ} />
                  ))}
                  {task.integrations.length < 3 && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>+</div>
                  )}
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', marginLeft: 4, padding: 4 }}>
                    <MoreHorizontal size={16} />
                  </button>
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
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Upcoming Deadlines</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingDeadlines.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < upcomingDeadlines.length - 1 ? 12 : 0, borderBottom: i < upcomingDeadlines.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{d.date}</div>
                  </div>
                  <span className={priorityDeadlineClass[d.priority]}>{d.priority}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 14 }}>Active Projects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeProjects.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < activeProjects.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{p.tasks} active task{p.tasks > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
