'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { DollarSign, Briefcase, Users, Clock, ArrowUpRight } from 'lucide-react'

interface Client { id: number; name: string; company: string; revenue: number }
interface Task { id: number; project: string; status: string }
interface Invoice { id: string; amount: number; status: string; issued: string }

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

const categoryData = [
  { name: 'Web Development', value: 35, color: '#16a34a' },
  { name: 'Design', value: 28, color: '#ec4899' },
  { name: 'Consulting', value: 18, color: '#f59e0b' },
  { name: 'Mobile', value: 12, color: '#10b981' },
  { name: 'Other', value: 7, color: '#06b6d4' },
]

const clientColors = ['#16a34a', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const tabs = ['Revenue', 'Projects', 'Clients']

const monthAbbr = () => new Date().toLocaleDateString('en-US', { month: 'short' })

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

  const revenueThisMonth = invoices
    .filter(i => i.status === 'Paid' && i.issued.startsWith(monthAbbr()))
    .reduce((s, i) => s + i.amount, 0)

  const activeProjects = new Set(
    tasks.filter(t => t.status !== 'completed' && t.project).map(t => t.project)
  ).size

  const topClients = [...clients]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)
    .map((c, i) => ({ name: c.company || c.name, revenue: c.revenue, color: clientColors[i % clientColors.length] }))

  const maxClientRevenue = Math.max(...topClients.map(c => c.revenue), 1)

  const metrics = [
    { label: 'Revenue This Month', value: `$${revenueThisMonth.toLocaleString()}`, change: '', icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Active Projects', value: String(activeProjects), change: '', icon: Briefcase, color: '#10b981', bg: '#d1fae5' },
    { label: 'Total Clients', value: String(clients.length), change: '', icon: Users, color: '#f59e0b', bg: '#fef9c3' },
    { label: 'Hours Worked', value: '156h', change: '', icon: Clock, color: '#ec4899', bg: '#fce7f3' },
  ]

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Insights</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Track your performance and growth</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {metrics.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: 20 }}>
                <ArrowUpRight size={11} /> {change}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
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
                  borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
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
              style={{ marginLeft: 'auto', padding: '6px 10px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 13, color: '#1c1917', background: 'var(--card)', cursor: 'pointer' }}
            >
              {['Last 7 months', 'Last 3 months', 'Last year'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {activeTab !== 'Clients' ? (
            <>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#1c1917', marginBottom: 16 }}>
                {activeTab === 'Revenue' ? 'Revenue Trend' : 'Projects Over Time'}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} />
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
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1c1917' }}>{c.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>${c.revenue.toLocaleString()}</span>
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
                  <span style={{ fontSize: 13, color: '#1c1917' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
