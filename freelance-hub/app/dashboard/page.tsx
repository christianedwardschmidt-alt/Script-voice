'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Download, Calendar, Flag, Clock, Play, Pause } from 'lucide-react'

const earningsData = [
  { month: 'Mar', v: 6200 },
  { month: 'Apr', v: 7800 },
  { month: 'May', v: 5900 },
  { month: 'Jun', v: 8400 },
  { month: 'Jul', v: 7100 },
  { month: 'Aug', v: 9200 },
  { month: 'Sep', v: 8800 },
  { month: 'Oct', v: 11000 },
  { month: 'Nov', v: 9600 },
  { month: 'Dec', v: 12400 },
]

const tasks = [
  { title: 'Complete website redesign mockups', priority: 'high', client: 'Tech Trophey', checked: false },
  { title: 'Review frontend code PR', priority: 'medium', client: 'Hencewood', checked: false },
  { title: 'Client meeting - Project kickoff', priority: 'high', client: 'Margono Studio', checked: false },
  { title: 'Update portfolio website', priority: 'low', client: 'Personal', checked: false },
]

const timeEntries = [
  { project: 'Tech Trophey Website', task: 'UI Design', time: '2:34:12', running: true },
  { project: 'Hencewood Digital', task: 'Code Review', time: '1:15:00', running: false },
]

const priorityBadge = (p: string) => {
  const map: Record<string, string> = {
    high: 'badge badge-high',
    medium: 'badge badge-medium',
    low: 'badge badge-low',
  }
  return map[p] || 'badge'
}

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>
            Welcome back, Christian 👋
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>{today}</p>
        </div>
        <button className="btn-primary">
          <Download size={15} />
          Download report
        </button>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Today's Schedule */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#7c3aed" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Today's Schedule</span>
            </div>
            <a href="#" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10 }}>
            <Calendar size={40} color="#d1d5db" />
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No events scheduled for today</p>
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 }}>
              Upcoming this week
            </p>
            {tasks.slice(0, 2).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i === 0 ? '1px solid #f3f4f6' : 'none' }}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span className={priorityBadge(t.priority)}>
                      <Flag size={9} /> {t.priority}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.client}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>My Tasks</span>
            <a href="/tasks" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < tasks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <span className={priorityBadge(t.priority)}>
                      <Flag size={9} /> {t.priority}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.client}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings Report */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Earning reports</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
              Yearly
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Income in 2024</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-1px' }}>$108.9k</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6" /></svg>
              2.3%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={earningsData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Income']}
              />
              <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Tracker */}
      <div style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#f59e0b" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Time Tracker</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timeEntries.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{entry.project}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{entry.task}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{entry.time}</span>
                  <button
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: entry.running ? '#7c3aed' : '#fff',
                      border: `2px solid ${entry.running ? '#7c3aed' : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    {entry.running
                      ? <Pause size={14} color="#fff" />
                      : <Play size={14} color="#6b7280" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
