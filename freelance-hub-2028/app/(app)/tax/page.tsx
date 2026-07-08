'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Download, FileText, Car, AlertCircle, Upload, Search, Check, ChevronRight } from 'lucide-react'

interface Invoice { id: string; amount: number; status: string; client: string }
interface Expense { id: number; date: string; description: string; category: string; amount: number; notes: string }
interface MileageEntry { id: number; date: string; from_loc: string; to_loc: string; purpose: string; miles: number }
interface QuarterlyPayment { id: number; quarter: string; year: number; paid_amount: number; paid_date: string }
interface TaxDocument { id: number; name: string; status: string; date: string; size: string; category: string }
interface Client { id: number; name: string; company: string; email: string }
interface W9Record { id: number; client_name: string; status: string }
interface TaxSettings { filing_status: string; state: string; entity_type: string; fiscal_year: string; accountant_email: string }

const EXPENSE_CATEGORIES = [
  'Home Office', 'Software & Subscriptions', 'Hardware & Equipment', 'Travel & Transportation',
  'Meals & Entertainment', 'Marketing & Advertising', 'Professional Development', 'Health Insurance',
  'Retirement (SEP-IRA)', 'Professional Services', 'Office Supplies', 'Other',
]

const DOC_CATEGORIES = ['All', '1099s Received', 'W-9s Collected', 'Quarterly Payment Receipts', 'Prior Year Returns', 'Other Tax Documents']

const CAT_COLOR: Record<string, string> = {
  'Home Office': '#6366F1', 'Software & Subscriptions': '#3B82F6', 'Hardware & Equipment': '#0EA5E9',
  'Travel & Transportation': '#14B8A6', 'Meals & Entertainment': '#F59E0B', 'Marketing & Advertising': '#F97316',
  'Professional Development': '#8B5CF6', 'Health Insurance': '#EC4899', 'Retirement (SEP-IRA)': '#16A34A',
  'Professional Services': '#64748B', 'Office Supplies': '#D97706', 'Other': '#9CA3AF',
}

const IRS_RATE = 0.67

const QUARTERS = [
  { q: 'Q1', label: 'Q1 · Jan–Mar', due: 'Apr 15, 2026' },
  { q: 'Q2', label: 'Q2 · Apr–Jun', due: 'Jun 16, 2026' },
  { q: 'Q3', label: 'Q3 · Jul–Sep', due: 'Sep 15, 2026' },
  { q: 'Q4', label: 'Q4 · Oct–Dec', due: 'Jan 15, 2027' },
]

const TABS = ['Overview', 'Quarterly', 'Expenses', 'Mileage', '1099 & W-9', 'Documents', 'Report', 'Settings']

const W9_STATUSES = ['needed', 'requested', 'received']
const W9_COLORS: Record<string, { bg: string; color: string }> = {
  needed:    { bg: '#FEF2F2', color: '#EF4444' },
  requested: { bg: '#FFFBEB', color: '#D97706' },
  received:  { bg: '#F0FDF4', color: '#16A34A' },
}

const iStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }
const lStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }
const btnP: React.CSSProperties = { padding: '9px 18px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }
const btnS: React.CSSProperties = { padding: '9px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }

function UL({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{children}</div>
}

function Modal({ open, onClose, title, width = 420, children }: { open: boolean; onClose: () => void; title: string; width?: number; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 28, width, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function TaxPage() {
  const [tab, setTab] = useState('Overview')

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [mileage, setMileage] = useState<MileageEntry[]>([])
  const [quarterly, setQuarterly] = useState<QuarterlyPayment[]>([])
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [w9Records, setW9Records] = useState<W9Record[]>([])
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({ filing_status: 'Single', state: '', entity_type: 'Sole Proprietor', fiscal_year: 'Calendar Year', accountant_email: '' })

  const [showExpModal, setShowExpModal] = useState(false)
  const [showMileModal, setShowMileModal] = useState(false)
  const [payingQuarter, setPayingQuarter] = useState<string | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)

  const [expForm, setExpForm] = useState({ date: '', description: '', category: EXPENSE_CATEGORIES[0], amount: '', notes: '' })
  const [mileForm, setMileForm] = useState({ date: '', from_loc: '', to_loc: '', purpose: '', miles: '' })
  const [payForm, setPayForm] = useState({ paid_amount: '', paid_date: new Date().toISOString().slice(0, 10) })
  const [docForm, setDocForm] = useState({ name: '', category: DOC_CATEGORIES[1] })

  const [docSearch, setDocSearch] = useState('')
  const [docCat, setDocCat] = useState('All')
  const [expCat, setExpCat] = useState('All')
  const [settSaved, setSettSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/tax/expenses').then(r => r.json()),
      fetch('/api/tax/mileage').then(r => r.json()),
      fetch('/api/tax/quarterly').then(r => r.json()),
      fetch('/api/tax/documents').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/tax/w9').then(r => r.json()),
      fetch('/api/tax/settings').then(r => r.json()),
    ]).then(([inv, exp, mil, qtr, docs, cli, w9, sett]) => {
      setInvoices(Array.isArray(inv) ? inv : [])
      setExpenses(Array.isArray(exp) ? exp : [])
      setMileage(Array.isArray(mil) ? mil : [])
      setQuarterly(Array.isArray(qtr) ? qtr : [])
      setDocuments(Array.isArray(docs) ? docs : [])
      setClients(Array.isArray(cli) ? cli : [])
      setW9Records(Array.isArray(w9) ? w9 : [])
      if (sett && !sett.error) setTaxSettings(sett)
    })
  }, [])

  // — Computed —
  const paidInvs = invoices.filter(i => i.status === 'Paid')
  const ytdRevenue = paidInvs.reduce((a, c) => a + (c.amount || 0), 0)
  const totalExp = expenses.reduce((a, c) => a + (c.amount || 0), 0)
  const totalMiles = mileage.reduce((a, c) => a + (c.miles || 0), 0)
  const mileageDed = Math.round(totalMiles * IRS_RATE)
  const totalDed = totalExp + mileageDed
  const netIncome = Math.max(ytdRevenue - totalDed, 0)
  const estTax = Math.round(netIncome * 0.25)
  const seTax = Math.round(ytdRevenue * 0.1413)
  const effectiveRate = ytdRevenue ? ((estTax / ytdRevenue) * 100).toFixed(1) : '0.0'
  const quarterlyAmt = Math.round(estTax / 4)
  const totalPaid = quarterly.filter(p => p.year === 2026).reduce((a, c) => a + (c.paid_amount || 0), 0)
  const outstanding = Math.max(estTax - totalPaid, 0)

  const clientRevMap: Record<string, number> = {}
  paidInvs.forEach(inv => { if (inv.client) clientRevMap[inv.client] = (clientRevMap[inv.client] || 0) + inv.amount })
  const clients1099 = Object.entries(clientRevMap).filter(([, v]) => v >= 600).map(([name, revenue]) => ({ name, revenue }))

  const expByCat: Record<string, number> = {}
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount })

  // — Actions —
  const addExpense = async () => {
    if (!expForm.description || !expForm.amount) return
    const res = await fetch('/api/tax/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expForm, amount: Number(expForm.amount) }),
    })
    const created = await res.json()
    setExpenses(prev => [created, ...prev])
    setExpForm({ date: '', description: '', category: EXPENSE_CATEGORIES[0], amount: '', notes: '' })
    setShowExpModal(false)
  }

  const deleteExpense = async (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    await fetch(`/api/tax/expenses/${id}`, { method: 'DELETE' })
  }

  const addMileage = async () => {
    if (!mileForm.from_loc || !mileForm.miles) return
    const res = await fetch('/api/tax/mileage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mileForm, miles: Number(mileForm.miles) }),
    })
    const created = await res.json()
    setMileage(prev => [created, ...prev])
    setMileForm({ date: '', from_loc: '', to_loc: '', purpose: '', miles: '' })
    setShowMileModal(false)
  }

  const deleteMileage = async (id: number) => {
    setMileage(prev => prev.filter(m => m.id !== id))
    await fetch(`/api/tax/mileage/${id}`, { method: 'DELETE' })
  }

  const markPaid = async () => {
    if (!payingQuarter || !payForm.paid_amount) return
    const res = await fetch('/api/tax/quarterly', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarter: payingQuarter, year: 2026, paid_amount: Number(payForm.paid_amount), paid_date: payForm.paid_date }),
    })
    const created = await res.json()
    setQuarterly(prev => [...prev, created])
    setPayForm({ paid_amount: '', paid_date: new Date().toISOString().slice(0, 10) })
    setPayingQuarter(null)
  }

  const undoPaid = async (id: number) => {
    setQuarterly(prev => prev.filter(p => p.id !== id))
    await fetch(`/api/tax/quarterly/${id}`, { method: 'DELETE' })
  }

  const cycleW9 = async (clientName: string) => {
    const rec = w9Records.find(r => r.client_name === clientName)
    const cur = rec?.status ?? 'needed'
    const next = W9_STATUSES[(W9_STATUSES.indexOf(cur) + 1) % W9_STATUSES.length]
    await fetch('/api/tax/w9', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: clientName, status: next }),
    })
    setW9Records(prev => {
      const existing = prev.find(r => r.client_name === clientName)
      if (existing) return prev.map(r => r.client_name === clientName ? { ...r, status: next } : r)
      return [...prev, { id: Date.now(), client_name: clientName, status: next }]
    })
  }

  const addDocument = async () => {
    if (!docForm.name) return
    const res = await fetch('/api/tax/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: docForm.name, category: docForm.category }),
    })
    const created = await res.json()
    setDocuments(prev => [created, ...prev])
    setDocForm({ name: '', category: DOC_CATEGORIES[1] })
    setShowDocModal(false)
  }

  const deleteDocument = async (id: number) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/tax/documents/${id}`, { method: 'DELETE' })
  }

  const saveSettings = async () => {
    await fetch('/api/tax/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taxSettings),
    })
    setSettSaved(true)
    setTimeout(() => setSettSaved(false), 2500)
  }

  const card: React.CSSProperties = { background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }

  // — Tab renders —

  const renderOverview = () => {
    const kpis = [
      { label: 'YTD Revenue',       value: `$${ytdRevenue.toLocaleString()}`,  color: '#16A34A' },
      { label: 'Business Expenses', value: `$${totalExp.toLocaleString()}`,     color: '#3B82F6' },
      { label: 'Mileage Deduction', value: `$${mileageDed.toLocaleString()}`,   color: '#8B5CF6' },
      { label: 'Net Income',        value: `$${netIncome.toLocaleString()}`,    color: '#D97706' },
      { label: 'Est. Tax Owed',     value: `$${estTax.toLocaleString()}`,       color: '#EF4444' },
    ]

    const currentQIdx = Math.min(Math.floor((new Date().getMonth()) / 3), 3)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI bar */}
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
          {kpis.map((k, i) => (
            <div key={k.label} style={{ padding: '24px 28px', borderRight: i < 4 ? '1px solid #F3F4F6' : 'none' }}>
              <UL>{k.label}</UL>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginTop: 4 }}>{k.value}</div>
              <div style={{ width: 20, height: 3, background: k.color, borderRadius: 99, marginTop: 10, opacity: 0.7 }} />
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Quarter tracker */}
          <div style={{ ...card, padding: 24 }}>
            <UL>Quarterly Payments</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              ${totalPaid.toLocaleString()} paid · ${outstanding.toLocaleString()} remaining
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUARTERS.map((q, idx) => {
                const payment = quarterly.find(p => p.quarter === q.q && p.year === 2026)
                const isPaid = !!payment
                const isCurrent = idx === currentQIdx
                return (
                  <div key={q.q} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: isCurrent && !isPaid ? '#FFFBEB' : isPaid ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${isCurrent && !isPaid ? '#FDE68A' : isPaid ? '#BBF7D0' : '#F3F4F6'}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isPaid ? '#16A34A' : isCurrent ? '#D97706' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isPaid ? <Check size={14} color="#fff" /> : <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#fff' : '#9CA3AF' }}>{q.q}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{q.label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Due {q.due}</div>
                    </div>
                    {isPaid
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'var(--font-display)' }}>${payment.paid_amount.toLocaleString()}</span>
                      : <span style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>~${quarterlyAmt.toLocaleString()}</span>
                    }
                  </div>
                )
              })}
            </div>
            <button onClick={() => setTab('Quarterly')} style={{ marginTop: 14, width: '100%', padding: '9px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Manage Payments <ChevronRight size={13} />
            </button>
          </div>

          {/* Expense breakdown */}
          <div style={{ ...card, padding: 24 }}>
            <UL>Top Expense Categories</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              ${totalExp.toLocaleString()} total deductible
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: CAT_COLOR[cat] ?? '#9CA3AF', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>${amt.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 3, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${totalExp ? Math.round((amt / totalExp) * 100) : 0}%`, background: CAT_COLOR[cat] ?? '#9CA3AF', borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(expByCat).length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>No expenses recorded yet</div>}
            </div>
            <button onClick={() => setTab('Expenses')} style={{ marginTop: 14, width: '100%', padding: '9px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              View All Expenses <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ ...card, padding: 24 }}>
            <UL>Est. Annual Tax</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginTop: 4 }}>${estTax.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 6 }}>Effective rate: {effectiveRate}%</div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#FEF2F2', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#EF4444', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Self-Employment Tax</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#EF4444' }}>${seTax.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#F87171', fontFamily: 'var(--font-body)', marginTop: 2 }}>12.4% SS + 2.9% Medicare on 92.35%</div>
            </div>
          </div>
          <div style={{ ...card, padding: 24 }}>
            <UL>Mileage Tracker</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginTop: 4 }}>{totalMiles.toLocaleString()} mi</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 6 }}>{mileage.length} trips recorded</div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#F0FDF4', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16A34A', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Deduction Value</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#16A34A' }}>${mileageDed.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#4ADE80', fontFamily: 'var(--font-body)', marginTop: 2 }}>IRS rate ${IRS_RATE}/mi · 2026</div>
            </div>
          </div>
          <div style={{ ...card, padding: 24 }}>
            <UL>1099 Clients</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginTop: 4 }}>{clients1099.length}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 6 }}>paid $600+ this year</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clients1099.slice(0, 3).map(c => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>${c.revenue.toLocaleString()}</span>
                </div>
              ))}
              {clients1099.length === 0 && <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>No qualifying clients yet</span>}
            </div>
            <button onClick={() => setTab('1099 & W-9')} style={{ marginTop: 14, width: '100%', padding: '8px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Manage <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderQuarterly = () => {
    const currentQIdx = Math.min(Math.floor((new Date().getMonth()) / 3), 3)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { label: 'Est. Annual Tax', value: `$${estTax.toLocaleString()}`, color: '#EF4444' },
            { label: 'Total Paid',      value: `$${totalPaid.toLocaleString()}`, color: '#16A34A' },
            { label: 'Outstanding',     value: `$${outstanding.toLocaleString()}`, color: '#D97706' },
          ].map((k, i) => (
            <div key={k.label} style={{ padding: '24px 28px', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
              <UL>{k.label}</UL>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginTop: 4 }}>{k.value}</div>
              <div style={{ width: 20, height: 3, background: k.color, borderRadius: 99, marginTop: 10, opacity: 0.7 }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {QUARTERS.map((q, idx) => {
            const payment = quarterly.find(p => p.quarter === q.q && p.year === 2026)
            const isPaid = !!payment
            const isCurrent = idx === currentQIdx
            return (
              <div key={q.q} style={{ ...card, padding: 24, border: isCurrent && !isPaid ? '1px solid #FDE68A' : isPaid ? '1px solid #BBF7D0' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <UL>{q.label}</UL>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginTop: 4 }}>
                      {isPaid ? `$${payment.paid_amount.toLocaleString()}` : `~$${quarterlyAmt.toLocaleString()}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, fontFamily: 'var(--font-body)', background: isPaid ? '#F0FDF4' : isCurrent ? '#FFFBEB' : '#F3F4F6', color: isPaid ? '#16A34A' : isCurrent ? '#D97706' : '#9CA3AF' }}>
                    {isPaid ? 'Paid' : isCurrent ? 'Due Soon' : 'Upcoming'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 16 }}>Due {q.due}</div>
                {isPaid ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDF4', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', fontFamily: 'var(--font-body)' }}>Paid {payment.paid_date ?? ''}</div>
                      <div style={{ fontSize: 11, color: '#4ADE80', fontFamily: 'var(--font-body)' }}>${payment.paid_amount.toLocaleString()}</div>
                    </div>
                    <button onClick={() => undoPaid(payment.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><Trash2 size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => setPayingQuarter(q.q)} style={{ ...btnP, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Check size={13} /> Mark as Paid
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ ...card, padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#92400E', fontFamily: 'var(--font-body)' }}>
              <strong>Safe Harbor:</strong> Pay at least 100% of last year&apos;s tax (or 110% if income &gt;$150k) to avoid underpayment penalties. Amounts shown are estimates based on current-year income.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderExpenses = () => {
    const filtered = expCat === 'All' ? expenses : expenses.filter(e => e.category === expCat)
    const filteredTotal = filtered.reduce((a, c) => a + c.amount, 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { label: 'Total Expenses', value: `$${totalExp.toLocaleString()}`, color: '#3B82F6' },
            { label: 'Records', value: `${expenses.length}`, color: '#8B5CF6' },
            { label: 'Top Category', value: Object.entries(expByCat).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—', color: '#16A34A' },
            { label: 'Avg per Entry', value: expenses.length ? `$${Math.round(totalExp / expenses.length).toLocaleString()}` : '—', color: '#D97706' },
          ].map((k, i) => (
            <div key={k.label} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
              <UL>{k.label}</UL>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginTop: 4 }}>{k.value}</div>
              <div style={{ width: 16, height: 3, background: k.color, borderRadius: 99, marginTop: 8, opacity: 0.7 }} />
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['All', ...EXPENSE_CATEGORIES].map(c => (
                <button key={c} onClick={() => setExpCat(c)} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', border: expCat === c ? 'none' : '1px solid #E5E7EB', background: expCat === c ? '#16A34A' : 'transparent', color: expCat === c ? '#fff' : '#6B7280' }}>
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setShowExpModal(true)} style={{ ...btnP, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={13} /> Add Expense</button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>No expenses in this category</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Date', 'Description', 'Category', 'Amount', 'Notes', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                      <td style={{ padding: '10px 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{e.date || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 500 }}>{e.description}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: (CAT_COLOR[e.category] ?? '#9CA3AF') + '18', color: CAT_COLOR[e.category] ?? '#9CA3AF' }}>{e.category}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>${e.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: '#9CA3AF', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => deleteExpense(e.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 12px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
                {expCat !== 'All' ? `${expCat}: ` : 'Total: '}${filteredTotal.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMileage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Miles', value: `${totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`, color: '#8B5CF6' },
          { label: 'Trips Logged', value: `${mileage.length}`, color: '#3B82F6' },
          { label: 'IRS Rate', value: `$${IRS_RATE}/mi`, color: '#16A34A' },
          { label: 'Deduction', value: `$${mileageDed.toLocaleString()}`, color: '#D97706' },
        ].map((k, i) => (
          <div key={k.label} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <UL>{k.label}</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginTop: 4 }}>{k.value}</div>
            <div style={{ width: 16, height: 3, background: k.color, borderRadius: 99, marginTop: 8, opacity: 0.7 }} />
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <UL>Mileage Log</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>{mileage.length} trips · ${IRS_RATE}/mi IRS standard rate</div>
          </div>
          <button onClick={() => setShowMileModal(true)} style={{ ...btnP, display: 'flex', alignItems: 'center', gap: 6 }}><Car size={13} /> Log Trip</button>
        </div>

        {mileage.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>No trips logged yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {['Date', 'From', 'To', 'Purpose', 'Miles', 'Deduction', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mileage.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '10px 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{m.date || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{m.from_loc}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{m.to_loc}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{m.purpose}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{m.miles}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>${(m.miles * IRS_RATE).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => deleteMileage(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const render1099 = () => {
    const allClientNames = [
      ...new Set([
        ...clients1099.map(c => c.name),
        ...clients.map(c => c.name),
        ...w9Records.map(r => r.client_name),
      ])
    ].filter(Boolean)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1099 Section */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <UL>1099-NEC Tracker</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Clients who paid you $600+ — must issue a 1099-NEC by Jan 31
            </div>
          </div>
          {clients1099.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>
              No clients have reached the $600 threshold yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clients1099.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#F8FAFC', borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>💼</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Paid invoices this year</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#111827' }}>${c.revenue.toLocaleString()}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: '#F0FDF4', color: '#16A34A', fontFamily: 'var(--font-body)' }}>Qualifies</span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    <Download size={11} /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* W-9 Section */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <UL>W-9 Collection Tracker</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Track W-9 status for all clients — click status to cycle
            </div>
          </div>
          {allClientNames.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>Add clients to track W-9 status</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allClientNames.map(name => {
                const rec = w9Records.find(r => r.client_name === name)
                const status = rec?.status ?? 'needed'
                const style = W9_COLORS[status] ?? W9_COLORS.needed
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', fontFamily: 'var(--font-body)' }}>{name}</div>
                    <button onClick={() => cycleW9(name)} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', background: style.bg, color: style.color }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
            Click a status to cycle: Needed → Requested → Received
          </div>
        </div>
      </div>
    )
  }

  const renderDocuments = () => {
    const filtered = documents.filter(d =>
      (docCat === 'All' || d.category === docCat) &&
      d.name.toLowerCase().includes(docSearch.toLowerCase())
    )

    const DOC_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
      Received:     { bg: '#EFF6FF', color: '#3B82F6' },
      'In Progress': { bg: '#FFFBEB', color: '#D97706' },
      Filed:        { bg: '#F0FDF4', color: '#16A34A' },
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <UL>Document Vault</UL>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                {documents.length} documents · {documents.filter(d => d.status === 'Filed').length} filed
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={docSearch} onChange={e => setDocSearch(e.target.value)} placeholder="Search documents…" style={{ ...iStyle, width: 200, paddingLeft: 32, fontSize: 13 }} />
              </div>
              <button onClick={() => setShowDocModal(true)} style={{ ...btnP, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={13} /> Upload</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {DOC_CATEGORIES.map(c => (
              <button key={c} onClick={() => setDocCat(c)} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', border: docCat === c ? 'none' : '1px solid #E5E7EB', background: docCat === c ? '#16A34A' : 'transparent', color: docCat === c ? '#fff' : '#6B7280' }}>
                {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>No documents found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 10 }}>
              {filtered.map(doc => {
                const st = DOC_STATUS_STYLE[doc.status] ?? DOC_STATUS_STYLE['Received']
                return (
                  <div key={doc.id} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #F3F4F6', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={st.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', marginBottom: 2 }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                          {doc.category || 'Other Tax Documents'}{doc.date ? ` · ${doc.date}` : ''}{doc.size && doc.size !== '—' ? ` · ${doc.size}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: st.bg, color: st.color, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{doc.status}</span>
                      <button onClick={() => deleteDocument(doc.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderReport = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <UL>Tax Summary Report</UL>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 4 }}>Freelance Income · 2026</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 4 }}>{taxSettings.entity_type} · {taxSettings.filing_status}{taxSettings.state ? ` · ${taxSettings.state}` : ''}</div>
          </div>
          <button style={{ ...btnP, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Export PDF</button>
        </div>

        {/* Income */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #F3F4F6' }}>INCOME</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Gross freelance income (paid invoices)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>${ytdRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Deductions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #F3F4F6' }}>DEDUCTIONS</div>
          {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
              <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>{cat}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-display)' }}>(${amt.toLocaleString()})</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Business mileage ({totalMiles.toFixed(1)} mi @ ${IRS_RATE})</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-display)' }}>(${mileageDed.toLocaleString()})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'var(--font-body)' }}>Total deductions</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', fontFamily: 'var(--font-display)' }}>(${totalDed.toLocaleString()})</span>
          </div>
        </div>

        {/* Net & Tax */}
        <div style={{ padding: '16px 20px', background: '#F8FAFC', borderRadius: 12 }}>
          {[
            { label: 'Net business income', value: `$${netIncome.toLocaleString()}`, color: '#111827', bold: false },
            { label: 'SE tax deduction (50% of SE tax)', value: `($${Math.round(seTax * 0.5).toLocaleString()})`, color: '#374151', bold: false },
            { label: 'Adjusted net income', value: `$${Math.max(netIncome - Math.round(seTax * 0.5), 0).toLocaleString()}`, color: '#111827', bold: false },
            { label: 'Estimated federal income tax (~25%)', value: `$${estTax.toLocaleString()}`, color: '#EF4444', bold: true },
            { label: 'Self-employment tax (15.3%)', value: `$${seTax.toLocaleString()}`, color: '#EF4444', bold: true },
            { label: 'Total estimated tax liability', value: `$${(estTax + seTax).toLocaleString()}`, color: '#DC2626', bold: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: row.bold ? 'none' : '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: 'var(--font-display)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Quarterly summary */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #F3F4F6' }}>QUARTERLY PAYMENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {QUARTERS.map(q => {
              const payment = quarterly.find(p => p.quarter === q.q && p.year === 2026)
              return (
                <div key={q.q} style={{ padding: '12px 14px', background: payment ? '#F0FDF4' : '#F8FAFC', borderRadius: 10, border: `1px solid ${payment ? '#BBF7D0' : '#F3F4F6'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{q.q}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: payment ? '#16A34A' : '#9CA3AF' }}>
                    {payment ? `$${payment.paid_amount.toLocaleString()}` : 'Unpaid'}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '10px 14px', background: outstanding > 0 ? '#FFFBEB' : '#F0FDF4', borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>Remaining estimated tax</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: outstanding > 0 ? '#D97706' : '#16A34A' }}>${outstanding.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <UL>Tax Settings</UL>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827', marginTop: 4 }}>Filing Preferences</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { label: 'Filing Status', key: 'filing_status', type: 'select', opts: ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'] },
            { label: 'State', key: 'state', type: 'text', placeholder: 'e.g. California' },
            { label: 'Entity Type', key: 'entity_type', type: 'select', opts: ['Sole Proprietor', 'Single-Member LLC', 'S-Corp', 'Partnership', 'C-Corp'] },
            { label: 'Fiscal Year', key: 'fiscal_year', type: 'select', opts: ['Calendar Year', 'Fiscal Year'] },
          ].map(f => (
            <div key={f.key}>
              <label style={lStyle}>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={taxSettings[f.key as keyof TaxSettings]}
                  onChange={e => setTaxSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ ...iStyle }}
                >
                  {f.opts!.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" placeholder={f.placeholder} value={taxSettings[f.key as keyof TaxSettings]} onChange={e => setTaxSettings(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...iStyle }} />
              )}
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lStyle}>Accountant Email</label>
            <input type="email" placeholder="accountant@firm.com" value={taxSettings.accountant_email} onChange={e => setTaxSettings(prev => ({ ...prev, accountant_email: e.target.value }))} style={{ ...iStyle }} />
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={saveSettings} style={btnP}>{settSaved ? '✓ Saved' : 'Save Settings'}</button>
          {settSaved && <span style={{ fontSize: 13, color: '#16A34A', fontFamily: 'var(--font-body)' }}>Settings saved successfully</span>}
        </div>
      </div>

      <div style={{ ...card, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <UL>Tax Reminders</UL>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>Key 2026 Dates</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { date: 'Jan 31', label: '1099-NEC deadline — clients must send to recipients' },
            { date: 'Apr 15', label: 'Q1 estimated tax payment due · 2025 tax return or extension' },
            { date: 'Jun 16', label: 'Q2 estimated tax payment due' },
            { date: 'Sep 15', label: 'Q3 estimated tax payment due' },
            { date: 'Jan 15, \'27', label: 'Q4 estimated tax payment due' },
          ].map(d => (
            <div key={d.date} style={{ display: 'flex', gap: 14, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', fontFamily: 'var(--font-display)', minWidth: 72 }}>{d.date}</span>
              <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tabContent: Record<string, () => React.ReactNode> = {
    Overview: renderOverview,
    Quarterly: renderQuarterly,
    Expenses: renderExpenses,
    Mileage: renderMileage,
    '1099 & W-9': render1099,
    Documents: renderDocuments,
    Report: renderReport,
    Settings: renderSettings,
  }

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>Tax Center</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280' }}>Maximize deductions · stay ahead of deadlines</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'white', borderRadius: 12, padding: 4, marginBottom: 24, boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: tab === t ? 700 : 500,
            background: tab === t ? '#16A34A' : 'transparent',
            color: tab === t ? '#fff' : '#6B7280',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Active tab */}
      {(tabContent[tab] ?? tabContent['Overview'])()}

      {/* Modals */}
      <Modal open={showExpModal} onClose={() => setShowExpModal(false)} title="Add Business Expense">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ label: 'Date', key: 'date', type: 'date' }, { label: 'Description', key: 'description', type: 'text', placeholder: 'e.g. Adobe Creative Cloud' }, { label: 'Amount ($)', key: 'amount', type: 'number', placeholder: '0' }, { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional' }].map(f => (
            <div key={f.key}>
              <label style={lStyle}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={expForm[f.key as keyof typeof expForm]} onChange={e => setExpForm(p => ({ ...p, [f.key]: e.target.value }))} style={iStyle} />
            </div>
          ))}
          <div>
            <label style={lStyle}>Category</label>
            <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} style={iStyle}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => setShowExpModal(false)} style={btnS}>Cancel</button>
          <button onClick={addExpense} style={btnP}>Save Expense</button>
        </div>
      </Modal>

      <Modal open={showMileModal} onClose={() => setShowMileModal(false)} title="Log Business Trip">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ label: 'Date', key: 'date', type: 'date' }, { label: 'From', key: 'from_loc', type: 'text', placeholder: 'Home' }, { label: 'To', key: 'to_loc', type: 'text', placeholder: 'Client office' }, { label: 'Purpose', key: 'purpose', type: 'text', placeholder: 'Client meeting' }, { label: 'Miles', key: 'miles', type: 'number', placeholder: '0' }].map(f => (
            <div key={f.key}>
              <label style={lStyle}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={mileForm[f.key as keyof typeof mileForm]} onChange={e => setMileForm(p => ({ ...p, [f.key]: e.target.value }))} style={iStyle} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, padding: '10px 12px', background: '#F0FDF4', borderRadius: 10, fontSize: 12, color: '#16A34A', fontFamily: 'var(--font-body)' }}>
          Deduction: ${mileForm.miles ? (Number(mileForm.miles) * IRS_RATE).toFixed(2) : '0.00'} at ${IRS_RATE}/mi
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => setShowMileModal(false)} style={btnS}>Cancel</button>
          <button onClick={addMileage} style={btnP}>Save Trip</button>
        </div>
      </Modal>

      <Modal open={!!payingQuarter} onClose={() => setPayingQuarter(null)} title={`Mark ${payingQuarter} 2026 as Paid`} width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lStyle}>Amount Paid ($)</label>
            <input type="number" placeholder={`${quarterlyAmt}`} value={payForm.paid_amount} onChange={e => setPayForm(p => ({ ...p, paid_amount: e.target.value }))} style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Payment Date</label>
            <input type="date" value={payForm.paid_date} onChange={e => setPayForm(p => ({ ...p, paid_date: e.target.value }))} style={iStyle} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => setPayingQuarter(null)} style={btnS}>Cancel</button>
          <button onClick={markPaid} style={btnP}>Confirm Payment</button>
        </div>
      </Modal>

      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Add Document" width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lStyle}>Document Name</label>
            <input type="text" placeholder="e.g. 1099-NEC from Acme Corp" value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Category</label>
            <select value={docForm.category} onChange={e => setDocForm(p => ({ ...p, category: e.target.value }))} style={iStyle}>
              {DOC_CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => setShowDocModal(false)} style={btnS}>Cancel</button>
          <button onClick={addDocument} style={btnP}>Save Document</button>
        </div>
      </Modal>
    </div>
  )
}
