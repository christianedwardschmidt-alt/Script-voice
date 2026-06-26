'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { Download, Flag, Clock, Play, Pause, TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Briefcase, Users, Star } from 'lucide-react'

const revenueData = [
  { month: 'Jan', income: 6200, expenses: 1800 },
  { month: 'Feb', income: 7400, expenses: 2100 },
  { month: 'Mar', income: 6800, expenses: 1900 },
  { month: 'Apr', income: 8900, expenses: 2400 },
  { month: 'May', income: 7600, expenses: 2000 },
  { month: 'Jun', income: 9800, expenses: 2600 },
  { month: 'Jul', income: 8400, expenses: 2200 },
  { month: 'Aug', income: 11200, expenses: 3100 },
  { month: 'Sep', income: 10600, expenses: 2800 },
  { month: 'Oct', income: 12800, expenses: 3400 },
  { month: 'Nov', income: 11400, expenses: 3000 },
  { month: 'Dec', income: 14200, expenses: 3800 },
]

const clientRevenue = [
  { name: 'Tech Trophey', revenue: 24500, color: '#7c3aed' },
  { name: 'Hencewood', revenue: 18200, color: '#ec4899' },
  { name: 'Margono Studio', revenue: 15800, color: '#f59e0b' },
  { name: 'NovaBuild', revenue: 12400, color: '#10b981' },
  { name: 'DataSync', revenue: 8900, color: '#06b6d4' },
]

const projectBreakdown = [
  { name: 'Web Dev', value: 35, color: '#7c3aed' },
  { name: 'UI Design', value: 28, color: '#ec4899' },
  { name: 'Consulting', value: 18, color: '#f59e0b' },
  { name: 'Mobile', value: 12, color: '#10b981' },
  { name: 'Other', value: 7, color: '#06b6d4' },
]

const tasks = [
  { title: 'Complete website redesign mockups', priority: 'high', client: 'Tech Trophey' },
  { title: 'Review frontend code PR', priority: 'medium', client: 'Hencewood' },
  { title: 'Client meeting — Project kickoff', priority: 'high', client: 'Margono Studio' },
  { title: 'Update portfolio website', priority: 'low', client: 'Personal' },
]

const timeEntries = [
  { project: 'Tech Trophey Website', task: 'UI Design', time: '2:34:12', running: true },
  { project: 'Hencewood Digital', task: 'Code Review', time: '1:15:00', running: false },
]

const activity = [
  { icon: '💳', text: 'Invoice #INV-090 paid', sub: 'Hencewood Digital', amount: '+$3,200', color: '#10b981', time: '2h ago' },
  { icon: '📋', text: 'New project proposal sent', sub: 'NovaBuild Inc.', amount: '$5,400', color: '#7c3aed', time: '5h ago' },
  { icon: '⚠️', text: 'Invoice #INV-088 overdue', sub: 'Margono Studio', amount: '$8,400', color: '#ef4444', time: '1d ago' },
  { icon: '✅', text: 'Task completed', sub: 'Brand Redesign Q4', amount: null, color: '#10b981', time: '2d ago' },
]

const priorityBadge = (p: string) => {
  const map: Record<string, string> = { high: 'badge badge-high', medium: 'badge badge-medium', low: 'badge badge-low' }
  return map[p] || 'badge'
}

const totalRevenue = revenueData.reduce((a, c) => a + c.income, 0)
const totalExpenses = revenueData.reduce((a, c) => a + c.expenses, 0)
const netProfit = totalRevenue - totalExpenses

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

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
        <button className="btn-primary"><Download size={15} /> Download report</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(1)}k`, change: '+18.2%', up: true, icon: DollarSign, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Net Profit', value: `$${(netProfit / 1000).toFixed(1)}k`, change: '+12.4%', up: true, icon: TrendingUp, color: '#10b981', bg: '#d1fae5' },
          { label: 'Active Projects', value: '26', change: '+3', up: true, icon: Briefcase, color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Active Clients', value: '14', change: '-1', up: false, icon: Users, color: '#ec4899', bg: '#fce7f3' },
        ].map(({ label, value, change, up, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600, color: up ? '#059669' : '#ef4444', background: up ? '#d1fae5' : '#fee2e2', padding: '2px 8px', borderRadius: 20 }}>
                {up ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />} {change}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Revenue Overview</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Income vs. expenses — 2024</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed', display: 'inline-block' }} /> Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fca5a5', display: 'inline-block' }} /> Expenses
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total income</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>${(totalRevenue / 1000).toFixed(1)}k</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net profit</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>${(netProfit / 1000).toFixed(1)}k</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{Math.round((netProfit / totalRevenue) * 100)}%</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="income" stroke="#7c3aed" strokeWidth={2.5} fill="url(#incomeGrad)" dot={false} name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" dot={false} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>Project Mix</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Revenue by category</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width={170} height={170}>
              <PieChart>
                <Pie data={projectBreakdown} cx="50%" cy="50%" innerRadius={46} outerRadius={78} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {projectBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {projectBreakdown.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client revenue bar + Tasks + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue by client */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>Top Clients</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Revenue by client</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clientRevenue.map((c, i) => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>${(c.revenue / 1000).toFixed(1)}k</span>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(c.revenue / 25000) * 100}%`, background: c.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>My Tasks</span>
            <a href="/tasks" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < tasks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer', marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <span className={priorityBadge(t.priority)}><Flag size={9} /> {t.priority}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.client}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activity.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 14, paddingTop: i > 0 ? 14 : 0, borderBottom: i < activity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.text}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {item.amount && <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.amount}</div>}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly bar chart + Time tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>Monthly Earnings Breakdown</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Income vs. Expenses per month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="income" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#fca5a5" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#f59e0b" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Time Tracker</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {timeEntries.map((entry, i) => (
              <div key={i} style={{ padding: '14px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.project}</div>
                  <button style={{ width: 30, height: 30, borderRadius: '50%', background: entry.running ? '#7c3aed' : '#fff', border: `2px solid ${entry.running ? '#7c3aed' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {entry.running ? <Pause size={12} color="#fff" /> : <Play size={12} color="#6b7280" />}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{entry.task}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: entry.running ? '#7c3aed' : '#111827', fontFamily: 'monospace' }}>{entry.time}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', background: '#ede9fe', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today Total</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>3:49:12</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>~$576 earned today</div>
          </div>
        </div>
      </div>
    </div>
  )
}
