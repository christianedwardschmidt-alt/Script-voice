'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, ArrowUpRight, Plus } from 'lucide-react'

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

const projectMix = [
  { name: 'Web Design',   value: 38, color: '#16a34a' },
  { name: 'Development',  value: 29, color: '#14b8a6' },
  { name: 'Branding',     value: 18, color: '#4ade80' },
  { name: 'Consulting',   value: 15, color: '#86efac' },
]

const topClients = [
  { name: 'Acme Corp',     revenue: 28400, pct: 100, avatar: 'AC', color: '#16a34a' },
  { name: 'Bloom Digital', revenue: 21200, pct: 75,  avatar: 'BD', color: '#14b8a6' },
  { name: 'Nova Studio',   revenue: 17800, pct: 63,  avatar: 'NS', color: '#4ade80' },
  { name: 'Peak Systems',  revenue: 14100, pct: 50,  avatar: 'PS', color: '#34d399' },
  { name: 'Grid & Co',     revenue: 9400,  pct: 33,  avatar: 'GC', color: '#fbbf24' },
]

const activity = [
  { text: 'Invoice #1042 paid — Acme Corp',   sub: '$4,200',      time: '2m ago',  dot: 'dot-green'  },
  { text: 'Homepage redesign delivered',        sub: 'Nova Studio', time: '1h ago',  dot: 'dot-cyan'   },
  { text: 'New message from Bloom Digital',     sub: 'Project brief', time: '3h ago', dot: 'dot-green' },
  { text: 'Invoice #1041 paid — Grid & Co',     sub: '$1,800',      time: '6h ago',  dot: 'dot-green'  },
  { text: 'Brand kit assets exported',          sub: 'Peak Systems', time: '1d ago',  dot: 'dot-amber'  },
]

const quickStats = [
  { label: 'Active Clients', value: '12',   delta: '+3',   color: '#16a34a' },
  { label: 'Tasks Done',     value: '89%',  delta: '+6%',  color: '#14b8a6' },
  { label: 'Hours Billed',   value: '124h', delta: '+12h', color: '#22c55e' },
  { label: 'Avg Rate',       value: '$85',  delta: '+$5',  color: '#34d399' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 11, color: '#6b9c7e', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 2 }}>
          <span>${Number(p.value).toLocaleString()}</span>
          <span style={{ color: '#166534', fontWeight: 400 }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('12M')
  const totalRevenue  = revenueData.reduce((s, d) => s + d.income, 0)
  const totalExpenses = revenueData.reduce((s, d) => s + d.expenses, 0)

  return (
    <div style={{ padding: '28px', background: 'var(--bg)', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Good morning, Christian 👋
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 3 }}>
            Here's what's happening with your business today.
          </p>
        </div>
        <button className="btn-primary"><Plus size={14} /> New Project</button>
      </div>

      {/* ── BENTO GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* ① Revenue hero — col 1-2 */}
        <div className="card-glow" style={{ gridColumn: '1 / 3', padding: 28, position: 'relative', overflow: 'hidden', minHeight: 200 }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>TOTAL REVENUE · 2024</div>
              <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#fff' }}>
                ${(totalRevenue / 1000).toFixed(1)}k
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#a7f3d0' }}>
                  <TrendingUp size={13} /> +18.2%
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>vs last year</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Net Profit</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                ${((totalRevenue - totalExpenses) / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: 11, color: '#a7f3d0', fontWeight: 700, marginTop: 3 }}>72% margin</div>
            </div>
          </div>

          <div style={{ marginTop: 24, height: 44 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barSize={12} barGap={3} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="income" fill="rgba(255,255,255,0.35)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ② Quick stats 2×2 — col 3 */}
        <div style={{ gridColumn: '3 / 4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {quickStats.map(stat => (
            <div key={stat.label} className="card" style={{ padding: '16px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: stat.color }}>{stat.delta}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 5 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ③ Income chart — col 1-2 */}
        <div className="card" style={{ gridColumn: '1 / 3', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Income vs Expenses</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Full year overview</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['3M','6M','12M'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} style={{
                  padding: '4px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid', transition: 'all 0.13s', fontFamily: 'inherit',
                  background:   chartPeriod === p ? 'rgba(22,163,74,0.15)' : 'transparent',
                  color:        chartPeriod === p ? '#16a34a' : 'var(--text-3)',
                  borderColor:  chartPeriod === p ? 'rgba(22,163,74,0.3)' : 'transparent',
                }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#6b9c7e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b9c7e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income"   name="Income"   stroke="#16a34a" strokeWidth={2} fill="url(#incomeGrad)"  />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#14b8a6" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ④ Activity feed — col 3 */}
        <div className="card" style={{ gridColumn: '3 / 4', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Live Activity</div>
            <button style={{ fontSize: 11, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>See all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <div className={a.dot} style={{ marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>{a.text}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: '#166534' }}>{a.sub}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ Top clients — col 1-2 */}
        <div className="card" style={{ gridColumn: '1 / 3', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Top Clients</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              View CRM <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {topClients.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: c.color, flexShrink: 0 }}>{c.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>${c.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-2)' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}66)`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ⑥ Project mix donut — col 3 */}
        <div className="card" style={{ gridColumn: '3 / 4', padding: 24 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Project Mix</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={projectMix} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value">
                {projectMix.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
            {projectMix.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
