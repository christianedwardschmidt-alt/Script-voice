'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

interface Client { id: number; name: string; company: string; revenue: number }
interface Task { id: number; project: string; status: string }
interface Invoice { id: string; amount: number; status: string; issued: string }

// ── Hardcoded monthly series for sparklines (matches dashboard data) ───────────
const SPARK_REV      = [7200, 9400, 8100, 11200, 10800, 13500, 12200, 14800, 13100, 16400, 15200, 17400]
const SPARK_PROJECTS = [3, 5, 4, 7, 6, 8, 9, 7, 11, 10, 13, 12]
const SPARK_CLIENTS  = [2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9]
const SPARK_AVG      = [3600, 4700, 4050, 5600, 5400, 6750, 6100, 7400, 6550, 8200, 7600, 8700]

// ── Sparkline — exact copy of dashboard implementation ────────────────────────
function Sparkline({ values, color, id }: { values: number[]; color: string; id: number }) {
  const w = 72, h = 26
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts: [number, number][] = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / range) * (h - 5) - 2.5,
  ])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fill = `${line} L${w},${h} L0,${h} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`isg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#isg${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={2.5} fill={color} />
    </svg>
  )
}

const revenueData = [
  { month: 'Jan', v: 4200 }, { month: 'Feb', v: 5100 }, { month: 'Mar', v: 4800 },
  { month: 'Apr', v: 5900 }, { month: 'May', v: 5400 }, { month: 'Jun', v: 6800 },
  { month: 'Jul', v: 7200 }, { month: 'Aug', v: 6900 }, { month: 'Sep', v: 8100 },
  { month: 'Oct', v: 9200 }, { month: 'Nov', v: 8800 }, { month: 'Dec', v: 9600 },
]

const projectsData = [
  { month: 'Jan', v: 3 }, { month: 'Feb', v: 5 }, { month: 'Mar', v: 4 },
  { month: 'Apr', v: 7 }, { month: 'May', v: 6 }, { month: 'Jun', v: 8 },
  { month: 'Jul', v: 9 }, { month: 'Aug', v: 7 }, { month: 'Sep', v: 11 },
  { month: 'Oct', v: 10 }, { month: 'Nov', v: 13 }, { month: 'Dec', v: 12 },
]

function pct(arr: number[], i = arr.length - 1) {
  const prev = arr[i - 1] || 1
  const curr = arr[i]
  return { pct: Math.abs(Math.round(((curr - prev) / prev) * 100)), up: curr >= prev }
}

const categoryData = [
  { name: 'Web Development', value: 35, color: '#16a34a' },
  { name: 'Design', value: 28, color: '#ec4899' },
  { name: 'Consulting', value: 18, color: '#f59e0b' },
  { name: 'Mobile', value: 12, color: '#10b981' },
  { name: 'Other', value: 7, color: '#06b6d4' },
]

const clientColors = ['#16a34a', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const tabs = ['Revenue', 'Projects', 'Clients']

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('Revenue')
  const [range, setRange] = useState('Last 7 months')
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/tasks').then(res => res.json()).then(d => setTasks(Array.isArray(d) ? d : []))
    fetch('/api/invoices').then(res => res.json()).then(d => setInvoices(Array.isArray(d) ? d : []))
  }, [])

  const chartData = activeTab === 'Projects' ? projectsData : revenueData

  const totalRevYTD  = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const activeProjects = new Set(tasks.filter(t => t.status !== 'completed' && t.project).map(t => t.project)).size
  const paidInvoices = invoices.filter(i => i.status === 'Paid')
  const avgInvoice   = paidInvoices.length ? Math.round(paidInvoices.reduce((s, i) => s + i.amount, 0) / paidInvoices.length) : 0

  const topClients = [...clients]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)
    .map((c, i) => ({ name: c.company || c.name, revenue: c.revenue, color: clientColors[i % clientColors.length] }))

  const maxClientRevenue = Math.max(...topClients.map(c => c.revenue), 1)

  const revT  = pct(SPARK_REV)
  const projT = pct(SPARK_PROJECTS)
  const cliT  = pct(SPARK_CLIENTS)
  const avgT  = pct(SPARK_AVG)

  const kpis = [
    {
      label: 'YTD Revenue',
      value: `$${(totalRevYTD / 1000).toFixed(1)}k`,
      trend: `${revT.up ? '+' : '−'}${revT.pct}% vs last mo`,
      up: revT.up,
      spark: SPARK_REV,
    },
    {
      label: 'Active Projects',
      value: String(Math.max(activeProjects, SPARK_PROJECTS[SPARK_PROJECTS.length - 1])),
      trend: `${projT.up ? '+' : '−'}${projT.pct}% vs last mo`,
      up: projT.up,
      spark: SPARK_PROJECTS,
    },
    {
      label: 'Total Clients',
      value: String(Math.max(clients.length, SPARK_CLIENTS[SPARK_CLIENTS.length - 1])),
      trend: `${cliT.up ? '+' : '−'}${cliT.pct}% vs last mo`,
      up: cliT.up,
      spark: SPARK_CLIENTS,
    },
    {
      label: 'Avg Invoice',
      value: avgInvoice > 0 ? `$${(avgInvoice / 1000).toFixed(1)}k` : `$${(SPARK_AVG[SPARK_AVG.length - 1] / 1000).toFixed(1)}k`,
      trend: `${avgT.up ? '+' : '−'}${avgT.pct}% vs last mo`,
      up: avgT.up,
      spark: SPARK_AVG,
    },
  ]

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 15, marginTop: 2 }}>Track your performance and growth</p>
      </div>

      {/* KPI bar — matches dashboard style exactly */}
      <div className="g-4col kpi-bar" style={{
        background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        marginBottom: 20,
      }}>
        {kpis.map((k, i) => (
          <div key={k.label} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 6, letterSpacing: '-0.02em' }}>
              {k.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: k.up ? 'var(--accent-brand)' : '#EF4444', fontFamily: 'var(--font-body)' }}>{k.trend}</span>
              <Sparkline values={k.spark} color={k.up ? 'var(--accent-brand)' : '#EF4444'} id={i} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Category */}
      <div className="g-sidebar" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  fontSize: 14,
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#111827' : '#9ca3af',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-brand)' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              style={{ marginLeft: 'auto', padding: '6px 10px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 13, color: '#111827', background: 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {['Last 7 months', 'Last 3 months', 'Last year'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {activeTab !== 'Clients' ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 16 }}>
                {activeTab === 'Revenue' ? 'Revenue Trend' : 'Projects Over Time'}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-brand)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent-brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="var(--accent-brand)" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topClients.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#111827' }}>{c.name}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#111827' }}>${c.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 5, background: '#f7f6f3', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.revenue / maxClientRevenue) * 100}%`, background: c.color, borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Category */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#1c1917', marginBottom: 16 }}>By Category</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {categoryData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#111827' }}>{item.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
