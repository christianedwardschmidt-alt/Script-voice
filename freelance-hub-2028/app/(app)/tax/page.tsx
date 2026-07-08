'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { Download, AlertCircle, Calculator, FileText, TrendingDown, Plus, Upload, DollarSign, Percent, X, Trash2 } from 'lucide-react'

interface Deduction { id: number; category: string; amount: number; icon: string; max: number; color: string }
interface TaxDocument { id: number; name: string; status: string; date: string; size: string }
interface Invoice { id: string; amount: number; status: string }

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

const taxBrackets = [
  { bracket: '10%', range: '$0 – $11,600', amount: 1160, filled: true },
  { bracket: '12%', range: '$11,601 – $47,150', amount: 4266, filled: true },
  { bracket: '22%', range: '$47,151 – $100,525', amount: 11743, filled: false },
  { bracket: '24%', range: '$100,526 – $191,950', amount: 0, filled: false },
]

const DOC_BADGE: Record<string, { color: string; bg: string }> = {
  Received:    { color: '#3B82F6', bg: '#EFF6FF' },
  'In Progress': { color: '#D97706', bg: '#FFFBEB' },
  Filed:       { color: '#16A34A', bg: '#F0FDF4' },
}

const TICK = 'rgba(120,128,145,0.7)'

export default function TaxPage() {
  const [activeYear, setActiveYear] = useState('2024')
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [docs, setDocs] = useState<TaxDocument[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showDeductionModal, setShowDeductionModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [deductionForm, setDeductionForm] = useState({ category: '', amount: '' })
  const [docForm, setDocForm] = useState({ name: '' })

  useEffect(() => {
    fetch('/api/tax/deductions').then(r => r.json()).then(setDeductions)
    fetch('/api/tax/documents').then(r => r.json()).then(setDocs)
    fetch('/api/invoices').then(r => r.json()).then(setInvoices)
  }, [])

  const totalIncome = invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const totalDeductions = deductions.reduce((a, c) => a + c.amount, 0)
  const taxableIncome = Math.max(totalIncome - totalDeductions, 0)
  const totalTax = Math.round(taxableIncome * 0.24)
  const effectiveRate = totalIncome ? ((totalTax / totalIncome) * 100).toFixed(1) : '0.0'
  const seRate = Math.round(totalIncome * 0.1413)
  const deductionPie = deductions.map(d => ({ name: d.category, value: d.amount, color: d.color }))

  const addDeduction = async () => {
    if (!deductionForm.category.trim() || !Number(deductionForm.amount)) return
    const res = await fetch('/api/tax/deductions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: deductionForm.category, amount: Number(deductionForm.amount) }),
    })
    const created = await res.json()
    setDeductions(prev => [...prev, created])
    setDeductionForm({ category: '', amount: '' })
    setShowDeductionModal(false)
  }

  const deleteDeduction = async (id: number) => {
    setDeductions(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/tax/deductions/${id}`, { method: 'DELETE' })
  }

  const addDocument = async () => {
    if (!docForm.name.trim()) return
    const res = await fetch('/api/tax/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: docForm.name }),
    })
    const created = await res.json()
    setDocs(prev => [created, ...prev])
    setDocForm({ name: '' })
    setShowDocModal(false)
  }

  const deleteDocument = async (id: number) => {
    setDocs(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/tax/documents/${id}`, { method: 'DELETE' })
  }

  const stats = [
    { label: 'Gross Income',    value: `$${totalIncome.toLocaleString()}`,    icon: DollarSign,  color: '#16A34A' },
    { label: 'Deductions',      value: `$${totalDeductions.toLocaleString()}`, icon: TrendingDown, color: '#10B981' },
    { label: 'Taxable Income',  value: `$${taxableIncome.toLocaleString()}`,   icon: Calculator,  color: '#D97706' },
    { label: 'Tax Owed',        value: `$${totalTax.toLocaleString()}`,         icon: FileText,    color: '#EF4444' },
    { label: 'Effective Rate',  value: `${effectiveRate}%`,                     icon: Percent,     color: '#6366F1' },
  ]

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Tax Center
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>
            Maximize deductions · minimize surprises
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
            {['2022', '2023', '2024'].map(y => (
              <button key={y} onClick={() => setActiveYear(y)} style={{
                padding: '8px 16px', border: 'none', fontFamily: 'var(--font-body)',
                background: activeYear === y ? '#16A34A' : 'transparent',
                color: activeYear === y ? '#fff' : '#6B7280',
                fontSize: 13, fontWeight: activeYear === y ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{y}</button>
            ))}
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10, background: '#16A34A', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
          }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Alert */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px', background: '#FFFBEB',
        border: '1px solid #FDE68A', borderRadius: 12, marginBottom: 28,
      }}>
        <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', fontFamily: 'var(--font-body)' }}>Q4 Estimated Tax due January 15 — $7,290</div>
          <div style={{ fontSize: 12, color: '#A16207', marginTop: 2, fontFamily: 'var(--font-body)' }}>Make your quarterly payment to avoid a 6% underpayment penalty</div>
        </div>
        <button style={{
          padding: '7px 14px', borderRadius: 8, background: 'white',
          border: '1px solid #F3F4F6', fontSize: 13, fontWeight: 600, color: '#16A34A',
          cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
        }}>Pay Now →</button>
      </div>

      {/* KPI unified bar */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 28,
      }} className="dash-kpi-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ padding: '24px 28px', borderRight: i < 4 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>{stat.value}</div>
            <div style={{ width: 20, height: 3, background: stat.color, borderRadius: 99, marginTop: 10, opacity: 0.6 }} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Quarterly bar */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>QUARTERLY</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>Income · Deductions · Tax Owed</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
              {[{ color: '#16A34A', label: 'Income' }, { color: '#10B981', label: 'Deductions' }, { color: '#D97706', label: 'Tax' }].map(({ color, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} /> {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="income" fill="#16A34A" radius={[4,4,0,0]} name="Income" />
              <Bar dataKey="deductions" fill="#10B981" radius={[4,4,0,0]} name="Deductions" />
              <Bar dataKey="taxOwed" fill="#D97706" radius={[4,4,0,0]} name="Tax Owed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deduction mix */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>DEDUCTIONS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Breakdown by Category</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ResponsiveContainer width={160} height={140}>
              <PieChart>
                <Pie data={deductionPie.length ? deductionPie : [{ name: 'none', value: 1, color: '#F3F4F6' }]} cx="50%" cy="50%" innerRadius={40} outerRadius={66} paddingAngle={3} dataKey="value">
                  {(deductionPie.length ? deductionPie : [{ color: '#F3F4F6' }]).map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {deductions.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < deductions.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{d.icon}</span>
                  <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>{d.category}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: d.color, fontFamily: 'var(--font-display)' }}>${d.amount.toLocaleString()}</span>
              </div>
            ))}
            {deductions.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>No deductions yet</div>}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly income */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>INCOME TREND</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Monthly · {activeYear}</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyIncome} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: TICK }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: TICK }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Income']} />
              <Area type="monotone" dataKey="v" stroke="#16A34A" strokeWidth={2} fill="url(#taxGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tax brackets */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>FEDERAL BRACKETS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Tax Schedule · 2024</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {taxBrackets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < taxBrackets.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: b.filled ? '#F0FDF4' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: b.filled ? '#16A34A' : '#D1D5DB',
                  fontFamily: 'var(--font-body)',
                }}>{b.bracket}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: b.filled ? '#6B7280' : '#D1D5DB', fontFamily: 'var(--font-body)' }}>{b.range}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.filled ? '#111827' : '#D1D5DB', fontFamily: 'var(--font-display)' }}>
                  {b.filled ? `$${b.amount.toLocaleString()}` : '—'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#FEF2F2', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#EF4444', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Self-Employment Tax</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#EF4444' }}>${seRate.toLocaleString()}</div>
          </div>
        </div>

        {/* Deductions editor */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>DEDUCTIONS</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>Total: ${totalDeductions.toLocaleString()}</div>
            </div>
            <button onClick={() => setShowDeductionModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, background: 'transparent',
              border: '1px solid #E5E7EB', color: '#374151',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}><Plus size={11} /> Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deductions.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{d.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: 'var(--font-display)' }}>${d.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((d.amount / d.max) * 100, 100)}%`, background: d.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <button onClick={() => deleteDeduction(d.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#F0FDF4', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16A34A', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Est. Tax Savings</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#16A34A' }}>~${Math.round(totalDeductions * 0.32).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>TAX DOCUMENTS</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              {docs.filter(d => d.status === 'Filed').length} of {docs.length} filed
            </div>
          </div>
          <button onClick={() => setShowDocModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10, background: 'transparent',
            border: '1px solid #E5E7EB', color: '#374151',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}><Upload size={13} /> Upload Document</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {docs.map(doc => {
            const badge = DOC_BADGE[doc.status] ?? DOC_BADGE['Received']
            return (
              <div key={doc.id} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #F3F4F6', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color={badge.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', marginBottom: 2 }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{doc.date}{doc.size !== '—' ? ` · ${doc.size}` : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: badge.bg, color: badge.color, fontFamily: 'var(--font-body)' }}>{doc.status}</span>
                  <button onClick={() => deleteDocument(doc.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Deduction Modal */}
      {showDeductionModal && (
        <div onClick={() => setShowDeductionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827' }}>Add Deduction</div>
              <button onClick={() => setShowDeductionModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ label: 'Category', key: 'category', placeholder: 'e.g. Software & Tools', type: 'text' }, { label: 'Amount ($)', key: 'amount', placeholder: '0', type: 'number' }].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={deductionForm[f.key as 'category' | 'amount']}
                    onChange={e => setDeductionForm({ ...deductionForm, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowDeductionModal(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={addDeduction} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocModal && (
        <div onClick={() => setShowDocModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827' }}>Upload Document</div>
              <button onClick={() => setShowDocModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Document Name</label>
              <input
                type="text"
                placeholder="e.g. 1099-NEC Form"
                value={docForm.name}
                onChange={e => setDocForm({ name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowDocModal(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={addDocument} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
