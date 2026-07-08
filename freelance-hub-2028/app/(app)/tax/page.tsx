'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import {
  Download, AlertCircle, Calculator, FileText, CheckCircle, TrendingDown,
  Plus, Upload, ChevronDown, DollarSign, Percent, Home, X, Trash2,
} from 'lucide-react'

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

const docStatus: Record<string, { cls: string; icon: string }> = {
  Received: { cls: 'badge-inprogress', icon: '📥' },
  'In Progress': { cls: 'badge-medium', icon: '⏳' },
  Filed: { cls: 'badge-completed', icon: '✅' },
}

const taxBrackets = [
  { bracket: '10%', range: '$0 – $11,600', amount: 1160, filled: true },
  { bracket: '12%', range: '$11,601 – $47,150', amount: 4266, filled: true },
  { bracket: '22%', range: '$47,151 – $100,525', amount: 11743, filled: false },
  { bracket: '24%', range: '$100,526 – $191,950', amount: 0, filled: false },
]

const emptyDeductionForm = { category: '', amount: '' }
const emptyDocForm = { name: '' }

export default function TaxPage() {
  const [activeYear, setActiveYear] = useState('2024')
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [docs, setDocs] = useState<TaxDocument[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showDeductionModal, setShowDeductionModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [deductionForm, setDeductionForm] = useState(emptyDeductionForm)
  const [docForm, setDocForm] = useState(emptyDocForm)

  useEffect(() => {
    fetch('/api/tax/deductions').then(res => res.json()).then(setDeductions)
    fetch('/api/tax/documents').then(res => res.json()).then(setDocs)
    fetch('/api/invoices').then(res => res.json()).then(setInvoices)
  }, [])

  const deductionPie = deductions.map(d => ({ name: d.category, value: d.amount, color: d.color }))

  const totalIncome = invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const totalDeductions = deductions.reduce((a, c) => a + c.amount, 0)
  const taxableIncome = Math.max(totalIncome - totalDeductions, 0)
  const totalTax = Math.round(taxableIncome * 0.24)
  const effectiveRate = totalIncome ? ((totalTax / totalIncome) * 100).toFixed(1) : '0.0'
  const seRate = (totalIncome * 0.1413).toFixed(0)

  const addDeduction = async () => {
    if (!deductionForm.category.trim() || !Number(deductionForm.amount)) return
    const res = await fetch('/api/tax/deductions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: deductionForm.category, amount: Number(deductionForm.amount) }),
    })
    const created = await res.json()
    setDeductions(prev => [...prev, created])
    setDeductionForm(emptyDeductionForm)
    setShowDeductionModal(false)
  }

  const deleteDeduction = async (id: number) => {
    setDeductions(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/tax/deductions/${id}`, { method: 'DELETE' })
  }

  const addDocument = async () => {
    if (!docForm.name.trim()) return
    const res = await fetch('/api/tax/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: docForm.name }),
    })
    const created = await res.json()
    setDocs(prev => [created, ...prev])
    setDocForm(emptyDocForm)
    setShowDocModal(false)
  }

  const deleteDocument = async (id: number) => {
    setDocs(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/tax/documents/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="page-pad" style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div className="page-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Tax Report</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Maximize deductions · minimize surprises</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
            {['2022', '2023', '2024'].map(y => (
              <button key={y} onClick={() => setActiveYear(y)} style={{ padding: '8px 16px', border: 'none', background: activeYear === y ? '#16a34a' : '#fff', color: activeYear === y ? '#fff' : '#6b7280', fontSize: 13, fontWeight: activeYear === y ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
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
        <a href="#" style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, textDecoration: 'none', marginLeft: 'auto', whiteSpace: 'nowrap', background: 'var(--card)', padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>
          Pay Now →
        </a>
      </div>

      {/* KPI cards */}
      <div className="g-5col" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Gross Income', value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
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
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#78716c', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Main charts row */}
      <div className="g-sidebar" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Quarterly bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Quarterly Breakdown</div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 6 }}>Income · Deductions · Tax Owed</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 20 }}>
            {[{ color: '#16a34a', label: 'Income' }, { color: '#10b981', label: 'Deductions' }, { color: '#f59e0b', label: 'Tax Owed' }].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#78716c' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} /> {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="deductions" fill="#10b981" radius={[4, 4, 0, 0]} name="Deductions" />
              <Bar dataKey="taxOwed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tax Owed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deductions pie */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Deduction Mix</div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 12 }}>Where your deductions come from</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={deductionPie} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                  {deductionPie.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {deductions.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{d.icon}</span>
                  <span style={{ fontSize: 12, color: '#1c1917' }}>{d.category}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>${d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income trend + Tax brackets + Deduction bars */}
      <div className="g-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly income trend */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Monthly Income</div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 16 }}>Taxable income over the year</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyIncome} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Income']} />
              <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2.5} fill="url(#taxGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tax bracket breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Tax Brackets</div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 16 }}>Federal income tax (2024)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taxBrackets.map((b, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: b.filled ? '#f7f6f3' : '#f9fafb', border: `1px solid ${b.filled ? '#bbf7d0' : '#f3f4f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: b.filled ? '#16a34a' : '#d1d5db' }}>{b.bracket}</span>
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
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917' }}>Deductions</div>
              <div style={{ fontSize: 13, color: '#78716c' }}>Total: ${totalDeductions.toLocaleString()}</div>
            </div>
            <button className="btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setShowDeductionModal(true)}><Plus size={11} /> Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deductions.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#1c1917', fontWeight: 500 }}>{d.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>${d.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: '#f7f6f3', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(d.amount / d.max) * 100}%`, background: d.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <button onClick={() => deleteDeduction(d.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
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
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1917' }}>Tax Documents</div>
            <div style={{ fontSize: 13, color: '#78716c' }}>{docs.filter(d => d.status === 'Filed').length} of {docs.length} filed</div>
          </div>
          <button className="btn-outline" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setShowDocModal(true)}><Upload size={13} /> Upload Document</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ padding: '14px 16px', background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{docStatus[doc.status].icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 2 }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: '#78716c' }}>{doc.date} {doc.size !== '—' ? `· ${doc.size}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${docStatus[doc.status].cls}`}>{doc.status}</span>
                <button onClick={() => deleteDocument(doc.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Deduction modal */}
      {showDeductionModal && (
        <div onClick={() => setShowDeductionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} className="card modal-card" style={{ padding: 24, width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1c1917' }}>Add Deduction</div>
              <button onClick={() => setShowDeductionModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 6 }}>Category</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: 12 }}
                  placeholder="e.g. Software & Tools"
                  value={deductionForm.category}
                  onChange={e => setDeductionForm({ ...deductionForm, category: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 6 }}>Amount</label>
                <input
                  type="number"
                  className="search-input"
                  style={{ paddingLeft: 12 }}
                  placeholder="0"
                  value={deductionForm.amount}
                  onChange={e => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-outline" onClick={() => setShowDeductionModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addDeduction}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document modal */}
      {showDocModal && (
        <div onClick={() => setShowDocModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} className="card modal-card" style={{ padding: 24, width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1c1917' }}>Upload Document</div>
              <button onClick={() => setShowDocModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 6 }}>Document Name</label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: 12 }}
                placeholder="e.g. 1099-NEC Form"
                value={docForm.name}
                onChange={e => setDocForm({ ...docForm, name: e.target.value })}
              />
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-outline" onClick={() => setShowDocModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addDocument}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
