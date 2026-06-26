'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Calculator,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  Calendar,
  TrendingDown,
  DollarSign,
  Clock,
  ChevronRight,
  Plus,
  Info,
} from 'lucide-react'

const quarterlyData = [
  { quarter: 'Q1', income: 24500, deductions: 6800, taxOwed: 4370 },
  { quarter: 'Q2', income: 31200, deductions: 8100, taxOwed: 5680 },
  { quarter: 'Q3', income: 27800, deductions: 7200, taxOwed: 4690 },
  { quarter: 'Q4', income: 38600, deductions: 9400, taxOwed: 7290 },
]

const deductions = [
  { category: 'Home Office', amount: 3600, icon: '🏠', eligible: true },
  { category: 'Software & Tools', amount: 2840, icon: '💻', eligible: true },
  { category: 'Education & Courses', amount: 1200, icon: '📚', eligible: true },
  { category: 'Equipment', amount: 4100, icon: '🖥', eligible: true },
  { category: 'Internet & Phone', amount: 960, icon: '📡', eligible: true },
  { category: 'Travel & Transport', amount: 1850, icon: '✈️', eligible: true },
  { category: 'Health Insurance', amount: 5400, icon: '🏥', eligible: true },
  { category: 'Meals (50%)', amount: 620, icon: '🍽', eligible: true },
]

const upcomingDeadlines = [
  { name: 'Q4 Estimated Tax', date: 'Jan 15, 2025', amount: 7290, urgent: true },
  { name: '2024 Annual Return', date: 'Apr 15, 2025', amount: null, urgent: false },
  { name: 'Self-Employment Tax', date: 'Apr 15, 2025', amount: 5820, urgent: false },
  { name: 'State Tax Return', date: 'Apr 15, 2025', amount: 2140, urgent: false },
]

const taxDocuments = [
  { name: '1099-NEC (Acme Corp)', year: 2024, status: 'Received', date: 'Jan 5' },
  { name: '1099-NEC (TechFlow)', year: 2024, status: 'Received', date: 'Jan 8' },
  { name: 'Schedule C Draft', year: 2024, status: 'In Progress', date: 'Jan 12' },
  { name: '2023 Tax Return', year: 2023, status: 'Filed', date: 'Apr 12' },
  { name: 'W-9 Forms', year: 2024, status: 'Complete', date: 'Dec 1' },
]

const card: React.CSSProperties = {
  background: '#0e0e1c',
  border: '1px solid #1a1a30',
  borderRadius: 14,
  padding: 20,
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#141428', border: '1px solid #252545', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ fontSize: 12, color: p.fill, fontWeight: 600 }}>
            {p.name}: ${p.value.toLocaleString()}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function TaxPage() {
  const [activeYear, setActiveYear] = useState('2024')

  const totalIncome = quarterlyData.reduce((a, c) => a + c.income, 0)
  const totalDeductions = deductions.reduce((a, c) => a + c.amount, 0)
  const totalTaxOwed = quarterlyData.reduce((a, c) => a + c.taxOwed, 0)
  const taxRate = ((totalTaxOwed / totalIncome) * 100).toFixed(1)
  const effectiveAfterDeductions = (((totalTaxOwed) / (totalIncome - totalDeductions)) * 100).toFixed(1)

  return (
    <div style={{ padding: '28px 32px', background: '#07070f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Tax Management</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Maximize deductions, minimize surprises
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={activeYear}
            onChange={(e) => setActiveYear(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: '#0e0e1c', border: '1px solid #252545', color: '#f1f5f9', fontSize: 13, cursor: 'pointer' }}
          >
            {['2024', '2023', '2022'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}>
            <Download size={14} />
            Export Tax Summary
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 10, marginBottom: 20 }}>
        <AlertCircle size={16} color="#f59e0b" />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>Q4 Estimated Tax Due January 15th</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}> — $7,290 due in 20 days. </span>
          <a href="#" style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Pay Now →</a>
        </div>
        <Clock size={14} color="#f59e0b" />
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Gross Income', value: `$${totalIncome.toLocaleString()}`, color: '#6366f1', icon: DollarSign, sub: `${activeYear} total` },
          { label: 'Total Deductions', value: `$${totalDeductions.toLocaleString()}`, color: '#10b981', icon: TrendingDown, sub: 'Estimated eligible' },
          { label: 'Est. Tax Owed', value: `$${totalTaxOwed.toLocaleString()}`, color: '#f59e0b', icon: Calculator, sub: 'Before optimization' },
          { label: 'Effective Rate', value: `${taxRate}%`, color: '#8b5cf6', icon: FileText, sub: `${effectiveAfterDeductions}% after deductions` },
        ].map(({ label, value, color, icon: Icon, sub }) => (
          <div key={label} className="card-hover" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Quarterly Breakdown Chart */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Quarterly Tax Breakdown</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Income · Deductions · Tax owed</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a30" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="deductions" fill="#10b981" radius={[4, 4, 0, 0]} name="Deductions" />
              <Bar dataKey="taxOwed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tax Owed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Upcoming Deadlines</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Don't miss these dates</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingDeadlines.map((d) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: d.urgent ? '#f59e0b08' : '#111120', border: `1px solid ${d.urgent ? '#f59e0b30' : '#1a1a30'}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Calendar size={14} color={d.urgent ? '#f59e0b' : '#475569'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#f1f5f9' }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: d.urgent ? '#f59e0b' : '#475569' }}>{d.date}</div>
                  </div>
                </div>
                {d.amount && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.urgent ? '#f59e0b' : '#94a3b8' }}>
                    ${d.amount.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Deductions Tracker */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Deductions Tracker</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                ${totalDeductions.toLocaleString()} potential savings
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: '#6366f118', color: '#818cf8', border: '1px solid #6366f130', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={12} />
              Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deductions.map((d) => (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>${d.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a30', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.amount / deductions[0].amount) * 100}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 2 }} />
                  </div>
                </div>
                <CheckCircle size={13} color="#10b981" />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', background: '#10b98110', border: '1px solid #10b98130', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Total Tax Savings</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
              ~${Math.round(totalDeductions * 0.32).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>at 32% effective tax rate</div>
          </div>
        </div>

        {/* Tax Documents */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Tax Documents</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Organize your filings</div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: '#6366f118', color: '#818cf8', border: '1px solid #6366f130', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Upload size={12} />
              Upload
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {taxDocuments.map((doc, i) => {
              const statusColor = doc.status === 'Filed' || doc.status === 'Complete' ? '#10b981' : doc.status === 'Received' ? '#6366f1' : '#f59e0b'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#111120', border: '1px solid #1a1a30', cursor: 'pointer' }} className="card-hover">
                  <FileText size={15} color="#475569" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{doc.year} · {doc.date}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                    {doc.status}
                  </span>
                  <ChevronRight size={13} color="#475569" />
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#6366f118', border: '1px solid #6366f130', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Info size={12} />
              Tax Guide
            </button>
            <button style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Calculator size={12} />
              Estimate Tax
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
