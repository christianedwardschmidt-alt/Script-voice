'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Plus, ArrowUpRight, Zap, Brain } from 'lucide-react'

const revenueData = [
  { month: 'Jan', income: 7200,  expenses: 2100 },
  { month: 'Feb', income: 9400,  expenses: 2800 },
  { month: 'Mar', income: 8100,  expenses: 1900 },
  { month: 'Apr', income: 11200, expenses: 3100 },
  { month: 'May', income: 10800, expenses: 2600 },
  { month: 'Jun', income: 13500, expenses: 3400 },
  { month: 'Jul', income: 12200, expenses: 2900 },
  { month: 'Aug', income: 14800, expenses: 3800 },
  { month: 'Sep', income: 13100, expenses: 3200 },
  { month: 'Oct', income: 16400, expenses: 4100 },
  { month: 'Nov', income: 15200, expenses: 3600 },
  { month: 'Dec', income: 17400, expenses: 4500 },
]

interface Client { id: number; name: string; company: string; status: string; revenue: number }
interface Task   { id: number; checked: boolean }
interface Invoice { id: string; amount: number; status: string }
interface ActivityRow { id: number; message: string; createdAt: string }

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.09)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: p.color }}>
          <span>${Number(p.value).toLocaleString()}</span>
          <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

const aiInsights = [
  { icon: '⚡', text: 'Stripe payment from Hencewood overdue by 3 days — send a nudge?', action: 'Draft email' },
  { icon: '📈', text: 'Revenue up 18% vs last quarter. Your best month was October at $16.4k.', action: 'See breakdown' },
  { icon: '🎯', text: '2 tasks due today. Prioritize "API Integration" for TechTrophy first.', action: 'View tasks' },
]

export default function DashboardPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [tasks, setTasks]       = useState<Task[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
    fetch('/api/invoices').then(r => r.json()).then(setInvoices)
    fetch('/api/activity?limit=6').then(r => r.json()).then(setActivity)
  }, [])

  const activeClients  = clients.filter(c => c.status === 'active').length
  const tasksDonePct   = tasks.length ? Math.round((tasks.filter(t => t.checked).length / tasks.length) * 100) : 0
  const outstanding    = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const totalRevYTD    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const thisMonthRev   = revenueData[revenueData.length - 1].income

  const kpi = [
    { label: 'YTD Revenue',    value: `$${(totalRevYTD / 1000).toFixed(1)}k`, sub: '+18% vs last year', accent: '#00b857' },
    { label: 'This Month',     value: `$${(thisMonthRev / 1000).toFixed(1)}k`, sub: 'December 2028',   accent: '#0ea5e9' },
    { label: 'Outstanding',    value: `$${(outstanding / 1000).toFixed(1)}k`,  sub: 'across invoices', accent: '#d97706' },
    { label: 'Active Clients', value: String(activeClients), sub: `of ${clients.length} total`,        accent: '#5b5fcf' },
    { label: 'Tasks Done',     value: `${tasksDonePct}%`,    sub: `${tasks.filter(t=>t.checked).length}/${tasks.length} complete`, accent: '#00b857' },
  ]

  return (
    <div style={{ padding: '28px 28px 48px', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>OVERVIEW</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text)', lineHeight: 1 }}>Dashboard</h1>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Wednesday, December 11 · 2028</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" style={{ fontSize: 12 }}>
            <TrendingUp size={13} /> Reports
          </button>
          <button className="btn-primary" style={{ fontSize: 12 }}>
            <Plus size={13} /> New Invoice
          </button>
        </div>
      </div>

      {/* AI Insights Bar */}
      <div className="card-ai" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Brain size={14} style={{ color: 'var(--indigo)' }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--indigo)' }}>AI Insights</span>
        </div>
        <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.08)' }} />
        {aiInsights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 12 }}>{ins.icon}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)', flex: 1, lineHeight: 1.4 }}>{ins.text}</span>
            <button style={{ border: 'none', background: 'rgba(91,95,207,0.09)', color: 'var(--indigo)', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {ins.action}
            </button>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpi.map(({ label, value, sub, accent }) => (
          <div key={label} className="card" style={{ padding: '18px 18px 16px', borderTop: `2px solid ${accent}` }}>
            <div className="section-label" style={{ marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Revenue chart */}
        <div className="card" style={{ padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 4 }}>REVENUE</div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text)' }}>Annual Overview · 2028</div>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 20, height: 2, background: '#00b857', display: 'inline-block', borderRadius: 2 }} />Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 20, height: 2, background: '#5b5fcf', display: 'inline-block', borderRadius: 2 }} />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b857" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#00b857" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5fcf" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#5b5fcf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(15,17,23,0.35)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(15,17,23,0.35)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="income"   stroke="#00b857" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="expenses" stroke="#5b5fcf" strokeWidth={1.5} fill="url(#expGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity + quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Quick stats — solid green card */}
          <div className="card-glow" style={{ padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Zap size={12} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>THIS WEEK</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Invoiced', val: '$4,200', color: '#fff' },
                { label: 'Collected', val: '$3,100', color: 'rgba(255,255,255,0.85)' },
                { label: 'Hours',    val: '38.5h',  color: '#fff' },
                { label: 'Rate',     val: '$140/h',  color: 'rgba(255,255,255,0.85)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-1px', color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ padding: '16px', flex: 1 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>RECENT ACTIVITY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.slice(0, 5).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.06)' : 'none', alignItems: 'flex-start' }}>
                  <div className="dot-green" style={{ flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{a.message}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: clients + tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top clients */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-label">TOP CLIENTS</div>
            <button style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--green)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              View all <ArrowUpRight size={10} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {clients.slice(0, 4).map((c, i) => {
              const colors = ['#00b857','#0ea5e9','#5b5fcf','#d97706']
              const col = colors[i % 4]
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${col}18`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.company}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>${c.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{c.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-label">OPEN TASKS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{tasksDonePct}% complete</div>
              <div style={{ width: 60, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ width: `${tasksDonePct}%`, height: '100%', background: 'linear-gradient(90deg, #007a3a, #00b857)', borderRadius: 99 }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {tasks.filter(t => !t.checked).slice(0, 4).map((t: any, i, arr) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid rgba(0,184,87,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{t.title || `Task #${t.id}`}</span>
                <span className={`badge badge-${(t.priority||'medium').toLowerCase()}`}>{t.priority || 'Medium'}</span>
              </div>
            ))}
            {tasks.filter(t => !t.checked).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 0' }}>All tasks complete ✓</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
