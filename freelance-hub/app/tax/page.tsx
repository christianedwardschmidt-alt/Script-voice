'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import {
  Download, AlertCircle, Calculator, FileText, CheckCircle, TrendingDown,
  Plus, Upload, ChevronDown, DollarSign, Percent, Home,
} from 'lucide-react'

const quarterlyData = [
  { quarter: 'Q1', income: 24500, deductions: 6800, taxOwed: 4370 },
  { quarter: 'Q2', income: 31200, deductions: 8100, taxOwed: 5680 },
  { quarter: 'Q3', income: 27800, deductions: 7200, taxOwed: 4690 },
  { quarter: 'Q4', income: 38600, deductions: 9400, taxOwed: 7290 },
]

const monthlyIncome = [
  { month: 'Jan', v: 6200 }, { month: 'Feb', v: 7400 }, { month: 'Mar', v: 6100 },
  { month: 'Apr', v: 8900 }, { month: 'May', v: 7600 }, { month: 'Jun', v: 8100 },
  { month: 'Jul', v: 6900 }, { month: 'Aug', v: 9800 }, { month: 'Sep', v: 9200 },
  { month: 'Oct', v: 11400 }, { month: 'Nov', v: 10200 }, { month: 'Dec', v: 16600 },
]

const deductions = [
  { category: 'Home Office', amount: 3600, icon: '🏠', max: 5400, color: '#7c3aed' },
  { category: 'Software & Tools', amount: 2840, icon: '💻', max: 5400, color: '#ec4899' },
  { category: 'Health Insurance', amount: 5400, icon: '🏥', max: 5400, color: '#10b981' },
  { category: 'Equipment', amount: 4100, icon: '🖥', max: 5400, color: '#f59e0b' },
  { category: 'Education', amount: 1200, icon: '📚', max: 5400, color: '#06b6d4' },
  { category: 'Internet & Phone', amount: 960, icon: '📡', max: 5400, color: '#6b6899' },
]

const deductionPie = deductions.map(d => ({ name: d.category, value: d.amount, color: d.color }))

const docs = [
  { name: '1099-NEC (Tech Trophey)', status: 'Received', date: 'Jan 5', size: '48 KB' },
  { name: '1099-NEC (Hencewood)', status: 'Received', date: 'Jan 8', size: '52 KB' },
  { name: 'Schedule C Draft', status: 'In Progress', date: 'Jan 12', size: '—' },
  { name: '2023 Tax Return', status: 'Filed', date: 'Apr 12', size: '210 KB' },
  { name: 'W-9 Form', status: 'Filed', date: 'Mar 1', size: '28 KB' },
  { name: 'Estimated Payments', status: 'In Progress', date: 'Jan 14', size: '—' },
]

const docStatus: Record<string, { cls: string; icon: string }> = {
  Received: { cls: 'badge-purple', icon: '📥' },
  'In Progress': { cls: 'badge-medium', icon: '⏳' },
  Filed: { cls: 'badge-completed', icon: '✅' },
}

const taxBrackets = [
  { bracket: '10%', range: '$0 – $11,600', amount: 1160, filled: true },
  { bracket: '12%', range: '$11,601 – $47,150', amount: 4266, filled: true },
  { bracket: '22%', range: '$47,151 – $100,525', amount: 11743, filled: false },
  { bracket: '24%', range: '$100,526 – $191,950', amount: 0, filled: false },
]

export default function TaxPage() {
  const [activeYear, setActiveYear] = useState('2024')
  const totalIncome = quarterlyData.reduce((a, c) => a + c.income, 0)
  const totalDeductions = deductions.reduce((a, c) => a + c.amount, 0)
  const totalTax = quarterlyData.reduce((a, c) => a + c.taxOwed, 0)
  const taxableIncome = totalIncome - totalDeductions
  const effectiveRate = ((totalTax / totalIncome) * 100).toFixed(1)
  const seRate = (totalIncome * 0.1413).toFixed(0)

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1535', letterSpacing: '-0.4px' }}>Tax Report</h1>
          <p style={{ color: '#6b6899', fontSize: 14, marginTop: 2 }}>Maximize deductions · minimize surprises</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 10, overflow: 'hidden' }}>
            {['2022', '2023', '2024'].map(y => (
              <button key={y} onClick={() => setActiveYear(y)} style={{ padding: '8px 16px', border: 'none', background: activeYear === y ? '#7c3aed' : '#fff', color: activeYear === y ? '#fff' : '#6b7280', fontSize: 13, fontWeight: activeYear === y ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                {y}
              </button>
            ))}
          </div>
          <button className="btn-primary"><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Alert */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 20 }}>
        <AlertCircle size={18} color="#ca8a04" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>Q4 Estimated Tax due January 15 — $7,290</div>
          <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>Make your quarterly payment to avoid a 6% underpayment penalty</div>
        </div>
        <a href="#" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, textDecoration: 'none', marginLeft: 'auto', whiteSpace: 'nowrap', background: 'var(--card)', padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(120,100,200,0.1)' }}>
          Pay Now →
        </a>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Gross Income', value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Deductions', value: `$${totalDeductions.toLocaleString()}`, icon: TrendingDown, color: '#10b981', bg: '#d1fae5' },
          { label: 'Taxable Income', value: `$${taxableIncome.toLocaleString()}`, icon: Calculator, color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Tax Owed', value: `$${totalTax.toLocaleString()}`, icon: FileText, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Effective Rate', value: `${effectiveRate}%`, icon: Percent, color: '#ec4899', bg: '#fce7f3' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1535', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#6b6899', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Main charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Quarterly bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535', marginBottom: 4 }}>Quarterly Breakdown</div>
          <div style={{ fontSize: 13, color: '#6b6899', marginBottom: 6 }}>Income · Deductions · Tax Owed</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 20 }}>
            {[{ color: '#7c3aed', label: 'Income' }, { color: '#10b981', label: 'Deductions' }, { color: '#f59e0b', label: 'Tax Owed' }].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b6899' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} /> {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="income" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="deductions" fill="#10b981" radius={[4, 4, 0, 0]} name="Deductions" />
              <Bar dataKey="taxOwed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tax Owed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deductions pie */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535', marginBottom: 4 }}>Deduction Mix</div>
          <div style={{ fontSize: 13, color: '#6b6899', marginBottom: 12 }}>Where your deductions come from</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={deductionPie} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                  {deductionPie.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ background: 'var(--card)', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {deductions.map(d => (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{d.icon}</span>
                  <span style={{ fontSize: 12, color: '#1a1535' }}>{d.category}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>${d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income trend + Tax brackets + Deduction bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly income trend */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535', marginBottom: 4 }}>Monthly Income</div>
          <div style={{ fontSize: 13, color: '#6b6899', marginBottom: 16 }}>Taxable income over the year</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyIncome} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Income']} />
              <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={2.5} fill="url(#taxGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tax bracket breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535', marginBottom: 4 }}>Tax Brackets</div>
          <div style={{ fontSize: 13, color: '#6b6899', marginBottom: 16 }}>Federal income tax (2024)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taxBrackets.map((b, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: b.filled ? '#f5f3ff' : '#f9fafb', border: `1px solid ${b.filled ? '#ddd6fe' : '#f3f4f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: b.filled ? '#7c3aed' : '#d1d5db' }}>{b.bracket}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: b.filled ? '#111827' : '#9ca3af' }}>{b.filled ? `$${b.amount.toLocaleString()}` : '—'}</span>
                </div>
                <div style={{ fontSize: 11, color: b.filled ? '#6b7280' : '#d1d5db' }}>{b.range}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#fee2e2', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Self-Employment Tax (15.3%)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>${Number(seRate).toLocaleString()}</div>
          </div>
        </div>

        {/* Deduction bars */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535' }}>Deductions</div>
              <div style={{ fontSize: 13, color: '#6b6899' }}>Total: ${totalDeductions.toLocaleString()}</div>
            </div>
            <button className="btn-outline" style={{ padding: '5px 10px', fontSize: 12 }}><Plus size={11} /> Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deductions.map(d => (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#1a1535', fontWeight: 500 }}>{d.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>${d.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: '#f5f3ff', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(d.amount / d.max) * 100}%`, background: d.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#d1fae5', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>Est. Tax Savings</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>~${Math.round(totalDeductions * 0.32).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1535' }}>Tax Documents</div>
            <div style={{ fontSize: 13, color: '#6b6899' }}>{docs.filter(d => d.status === 'Filed').length} of {docs.length} filed</div>
          </div>
          <button className="btn-outline" style={{ padding: '7px 14px', fontSize: 13 }}><Upload size={13} /> Upload Document</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-2)', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{docStatus[doc.status].icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1535', marginBottom: 2 }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: '#6b6899' }}>{doc.date} {doc.size !== '—' ? `· ${doc.size}` : ''}</div>
                </div>
              </div>
              <span className={`badge ${docStatus[doc.status].cls}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
