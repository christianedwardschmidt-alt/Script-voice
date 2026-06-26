'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MoreHorizontal,
} from 'lucide-react'

const earningsData = [
  { month: 'Jan', earnings: 4200, expenses: 800 },
  { month: 'Feb', earnings: 5800, expenses: 1100 },
  { month: 'Mar', earnings: 4900, expenses: 950 },
  { month: 'Apr', earnings: 7200, expenses: 1400 },
  { month: 'May', earnings: 6100, expenses: 1200 },
  { month: 'Jun', earnings: 8900, expenses: 1600 },
  { month: 'Jul', earnings: 7400, expenses: 1350 },
  { month: 'Aug', earnings: 9800, expenses: 1800 },
  { month: 'Sep', earnings: 8200, expenses: 1500 },
  { month: 'Oct', earnings: 11200, expenses: 2100 },
  { month: 'Nov', earnings: 9600, expenses: 1700 },
  { month: 'Dec', earnings: 12400, expenses: 2300 },
]

const revenueByService = [
  { name: 'Design', value: 35, color: '#6366f1' },
  { name: 'Development', value: 40, color: '#8b5cf6' },
  { name: 'Consulting', value: 15, color: '#06b6d4' },
  { name: 'Writing', value: 10, color: '#10b981' },
]

const recentProjects = [
  { client: 'Acme Corp', project: 'Brand Redesign', amount: 4800, status: 'Completed', due: 'Dec 15' },
  { client: 'TechFlow', project: 'API Integration', amount: 3200, status: 'In Progress', due: 'Dec 28' },
  { client: 'Bright Ideas', project: 'Marketing Site', amount: 6500, status: 'Review', due: 'Jan 5' },
  { client: 'DataSync', project: 'Dashboard UI', amount: 2800, status: 'In Progress', due: 'Jan 12' },
  { client: 'NovaBuild', project: 'Mobile App', amount: 9200, status: 'Pending', due: 'Jan 20' },
]

const statusColors: Record<string, string> = {
  Completed: '#10b981',
  'In Progress': '#6366f1',
  Review: '#f59e0b',
  Pending: '#64748b',
}

const metrics = [
  {
    label: 'Total Earnings',
    value: '$96,200',
    change: '+18.4%',
    up: true,
    icon: DollarSign,
    color: '#6366f1',
    sub: 'This year',
  },
  {
    label: 'Active Projects',
    value: '12',
    change: '+3',
    up: true,
    icon: Clock,
    color: '#8b5cf6',
    sub: 'vs last month',
  },
  {
    label: 'Active Clients',
    value: '28',
    change: '+5',
    up: true,
    icon: Users,
    color: '#06b6d4',
    sub: 'vs last quarter',
  },
  {
    label: 'Avg Rating',
    value: '4.9',
    change: '+0.2',
    up: true,
    icon: Star,
    color: '#f59e0b',
    sub: 'Client score',
  },
]

const s = {
  page: {
    padding: '28px 32px',
    background: '#07070f',
    minHeight: '100vh',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  } as React.CSSProperties,
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  } as React.CSSProperties,
  card: {
    background: '#0e0e1c',
    border: '1px solid #1a1a30',
    borderRadius: 14,
    padding: 20,
  } as React.CSSProperties,
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 20,
  } as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 16,
    marginBottom: 20,
  } as React.CSSProperties,
}

function MetricCard({ metric }: { metric: typeof metrics[0] }) {
  const Icon = metric.icon
  return (
    <div className="card-hover" style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {metric.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-1px' }}>
            {metric.value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            {metric.up ? (
              <ArrowUpRight size={13} color="#10b981" />
            ) : (
              <ArrowDownRight size={13} color="#ef4444" />
            )}
            <span style={{ fontSize: 12, color: metric.up ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {metric.change}
            </span>
            <span style={{ fontSize: 12, color: '#475569' }}>{metric.sub}</span>
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${metric.color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={metric.color} />
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#141428', border: '1px solid #252545', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
            {p.name}: ${p.value.toLocaleString()}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Financial Dashboard</h1>
          <p style={s.subtitle}>Welcome back, Alex — here's your business overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #252545',
              background: '#0e0e1c',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Calendar size={14} />
            Dec 2024
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#6366f1',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(99,102,241,0.3)',
            }}
          >
            <TrendingUp size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={s.grid4}>
        {metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
      </div>

      {/* Charts row */}
      <div style={s.grid2}>
        {/* Earnings Chart */}
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Earnings vs Expenses</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Full year 2024</div>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <MoreHorizontal size={16} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={earningsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a30" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2} fill="url(#earningsGrad)" name="Earnings" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expensesGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown */}
        <div style={s.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Revenue by Service</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>2024 breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={revenueByService}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {revenueByService.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: '#141428', border: '1px solid #252545', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {revenueByService.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Active Projects</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Track your ongoing work</div>
          </div>
          <button style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            View All
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Client', 'Project', 'Amount', 'Status', 'Due Date'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 11,
                      color: '#475569',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      paddingBottom: 12,
                      borderBottom: '1px solid #1a1a30',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((p, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < recentProjects.length - 1 ? '1px solid #111120' : 'none',
                  }}
                >
                  <td style={{ padding: '14px 0', fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{p.client}</td>
                  <td style={{ padding: '14px 0', fontSize: 13, color: '#94a3b8' }}>{p.project}</td>
                  <td style={{ padding: '14px 0', fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                    ${p.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: statusColors[p.status],
                        background: `${statusColors[p.status]}18`,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 0', fontSize: 13, color: '#64748b' }}>{p.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
