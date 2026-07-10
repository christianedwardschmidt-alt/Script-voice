'use client'

import { useEffect, useState } from 'react'
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, parseISO } from 'date-fns'
import {
  Plus, Search, Send, Eye, CheckCircle, Clock,
  AlertCircle, X, Trash2, ChevronDown, FileText, MoreHorizontal,
  RefreshCw, Pause, Play, Ban, ChevronRight, History,
} from 'lucide-react'

// lib/recurringInvoices.ts imports './db' (node 'crypto') so it can't be shared into this
// client bundle — these mirror its pure date helpers for the live preview line only.
function addFrequency(dateStr: string, frequency: string, customInterval: number, customPeriod: string): string {
  const d = parseISO(dateStr)
  switch (frequency) {
    case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd')
    case 'biweekly': return format(addWeeks(d, 2), 'yyyy-MM-dd')
    case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd')
    case 'quarterly': return format(addQuarters(d, 1), 'yyyy-MM-dd')
    case 'annually': return format(addYears(d, 1), 'yyyy-MM-dd')
    case 'custom':
      if (customPeriod === 'weeks') return format(addWeeks(d, customInterval), 'yyyy-MM-dd')
      if (customPeriod === 'months') return format(addMonths(d, customInterval), 'yyyy-MM-dd')
      return format(addDays(d, customInterval), 'yyyy-MM-dd')
    default: return format(addMonths(d, 1), 'yyyy-MM-dd')
  }
}
function humanFrequency(frequency: string, customInterval: number, customPeriod: string): string {
  switch (frequency) {
    case 'weekly': return 'weekly'
    case 'biweekly': return 'every 2 weeks'
    case 'monthly': return 'monthly'
    case 'quarterly': return 'quarterly'
    case 'annually': return 'annually'
    case 'custom': return `every ${customInterval} ${customPeriod}`
    default: return frequency
  }
}

type Status = 'Paid' | 'Pending' | 'Overdue' | 'Draft'
const ALL_STATUSES: Status[] = ['Draft', 'Pending', 'Overdue', 'Paid']

const statusStyle: Record<Status, { color: string; bg: string }> = {
  Paid:    { color: '#16A34A', bg: '#16A34A12' },
  Pending: { color: '#D97706', bg: '#D9770612' },
  Overdue: { color: '#DC2626', bg: '#DC262612' },
  Draft:   { color: '#6B7280', bg: '#6B728012' },
}

interface Invoice {
  id: string; client: string; project: string
  amount: number; status: Status
  issued: string; due: string; avatar: string; color: string
  late_fee_enabled: boolean; late_fee_percentage: number; late_fee_grace_days: number
  late_fee_applied: boolean; late_fee_amount: number; late_fee_waived: boolean
  recurring_template_id: number | null; awaiting_amount: boolean
}
interface LineItem { description: string; qty: number; rate: number }

type RecurStatus = 'active' | 'paused' | 'cancelled' | 'completed'
type AmountMode = 'fixed' | 'variable'
type EndCondition = 'indefinite' | 'after_occurrences' | 'on_date'

interface RecurringLog {
  id: number; template_id: number; invoice_id: string | null
  scheduled_date: string; sent_at: string | null
  status: 'success' | 'failed' | 'pending_amount' | 'pending'
  error_message: string; retry_count: number
}

interface RecurringTemplate {
  id: number; client_name: string; client_email: string; project: string
  line_items: LineItem[]; subtotal: number; total: number
  amount_mode: AmountMode
  frequency: string; custom_interval: number; custom_period: string
  start_date: string
  end_condition: EndCondition; end_after_occurrences: number | null; end_date: string | null
  send_time: string; next_send_date: string; total_sends: number
  client_notification_enabled: boolean | number
  status: RecurStatus
  avatar: string; color: string
  upcoming: string[]
  logs?: RecurringLog[]
}

const COLORS = ['#16A34A', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6']
function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function todayIso() { return new Date().toISOString().split('T')[0] }
function emptyLine(): LineItem { return { description: '', qty: 1, rate: 0 } }
function effectiveTotal(inv: Invoice) {
  return inv.late_fee_applied && !inv.late_fee_waived ? inv.amount + inv.late_fee_amount : inv.amount
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: number }) {
  const w = 72, h = 26
  const min = Math.min(...values), max = Math.max(...values)
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
        <linearGradient id={`invsg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#invsg${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={2.5} fill={color} />
    </svg>
  )
}

const RECUR_STATUS_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:    { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', label: 'Active' },
  paused:    { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', label: 'Paused' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', label: 'Cancelled' },
  completed: { color: '#374151', bg: '#F3F4F6', border: '#E5E7EB', label: 'Completed' },
}
function RecurStatusBadge({ status }: { status: string }) {
  const st = RECUR_STATUS_STYLE[status] ?? RECUR_STATUS_STYLE.active
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 9px', borderRadius: 20, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
      {st.label}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#F9FAFB', border: '1px solid #F3F4F6',
  borderRadius: 10, fontSize: 13, color: '#111827',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#9CA3AF', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)',
}

function RadioRow({ checked, onClick, label, children }: { checked: boolean; onClick: () => void; label: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <button type="button" onClick={onClick} style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${checked ? '#16A34A' : '#D1D5DB'}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />}
      </button>
      <span onClick={onClick} style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', cursor: 'pointer', flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}

export default function BillingPage() {
  const [invoices, setInvoices]     = useState<Invoice[]>([])
  const [loading, setLoading]       = useState(true)
  const [showNew, setShowNew]       = useState(false)
  const [activeStatus, setActive]   = useState('All')
  const [search, setSearch]         = useState('')
  const [preview, setPreview]       = useState<Invoice | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openStatusId, setOpenSt]   = useState<string | null>(null)

  const [fClient, setFClient]     = useState('')
  const [fIssued, setFIssued]     = useState(todayIso())
  const [fDue,    setFDue]        = useState('')
  const [fNotes,  setFNotes]      = useState('')
  const [lines,   setLines]       = useState<LineItem[]>([emptyLine()])

  const [fLateFeeEnabled,    setFLateFeeEnabled]    = useState(false)
  const [fLateFeePercentage, setFLateFeePercentage] = useState(1.5)
  const [fLateFeeDays,       setFLateFeeDays]       = useState(30)

  // Recurring invoice form fields
  const [fRecurring,          setFRecurring]          = useState(false)
  const [fFrequency,          setFFrequency]          = useState('monthly')
  const [fCustomInterval,     setFCustomInterval]     = useState(1)
  const [fCustomPeriod,       setFCustomPeriod]       = useState('days')
  const [fStartDate,          setFStartDate]          = useState(todayIso())
  const [fEndCondition,       setFEndCondition]       = useState<EndCondition>('indefinite')
  const [fEndAfterOccur,      setFEndAfterOccur]      = useState(12)
  const [fEndDate,            setFEndDate]            = useState('')
  const [fSendTime,           setFSendTime]           = useState('09:00')
  const [fAmountMode,         setFAmountMode]         = useState<AmountMode>('fixed')
  const [fClientNotify,       setFClientNotify]       = useState(true)
  const [recurError,          setRecurError]          = useState('')

  // Recurring management
  const [recurring, setRecurring]         = useState<RecurringTemplate[]>([])
  const [recurLoading, setRecurLoading]   = useState(true)
  const [detailId, setDetailId]           = useState<number | null>(null)
  const [detail, setDetail]               = useState<RecurringTemplate | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null)
  const [approveAmount, setApproveAmount] = useState('')

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json())
      .then(d => {
        const list: Invoice[] = Array.isArray(d) ? d : []
        setInvoices(list)
        setLoading(false)
        const invoiceParam = new URLSearchParams(window.location.search).get('invoice')
        if (invoiceParam) {
          const match = list.find(i => i.id === invoiceParam)
          if (match) setPreview(match)
        }
      })
  }, [])

  useEffect(() => {
    fetch('/api/recurring-invoices').then(r => r.json())
      .then(d => { setRecurring(Array.isArray(d) ? d : []); setRecurLoading(false) })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'recurring') setActive('Recurring')
    const templateParam = params.get('template')
    if (templateParam) setDetailId(Number(templateParam))
  }, [])

  useEffect(() => {
    if (detailId == null) { setDetail(null); return }
    fetch(`/api/recurring-invoices/${detailId}`).then(r => r.json()).then(setDetail)
  }, [detailId])

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-dropdown]')) {
        setOpenMenuId(null); setOpenSt(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const totals = {
    paid:    invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0),
    pending: invoices.filter(i => i.status === 'Pending').reduce((a, c) => a + c.amount, 0),
    overdue: invoices.filter(i => i.status === 'Overdue').reduce((a, c) => a + c.amount, 0),
  }

  const filtered = invoices.filter(inv => {
    const matchStatus = activeStatus === 'All' || inv.status === activeStatus
    const q = search.toLowerCase()
    const matchSearch = !q || inv.client.toLowerCase().includes(q) || inv.project.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0)

  function resetForm() {
    setFClient(''); setFIssued(todayIso()); setFDue(''); setFNotes(''); setLines([emptyLine()])
    setFLateFeeEnabled(false); setFLateFeePercentage(1.5); setFLateFeeDays(30)
    setFRecurring(false); setFFrequency('monthly'); setFCustomInterval(1); setFCustomPeriod('days')
    setFStartDate(todayIso()); setFEndCondition('indefinite'); setFEndAfterOccur(12); setFEndDate('')
    setFSendTime('09:00'); setFAmountMode('fixed'); setFClientNotify(true); setRecurError('')
  }

  async function createInvoice(status: Status) {
    if (!fClient.trim() || subtotal <= 0) return
    const project = lines.filter(l => l.description).map(l => l.description).join(', ') || 'Services'
    const avatar  = fClient.trim().charAt(0).toUpperCase() || '?'
    const color   = COLORS[invoices.length % COLORS.length]
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: fClient, project, amount: subtotal, status, issued: fIssued, due: fDue, avatar, color,
        late_fee_enabled: fLateFeeEnabled,
        late_fee_percentage: fLateFeePercentage,
        late_fee_grace_days: fLateFeeDays,
      }),
    })
    const created = await res.json()
    setInvoices(prev => [created, ...prev])
    resetForm(); setShowNew(false)
  }

  async function createRecurringInvoice() {
    setRecurError('')
    if (!fClient.trim()) { setRecurError('Client name is required'); return }
    if (fAmountMode === 'fixed' && subtotal <= 0) { setRecurError('Add at least one line item with an amount'); return }
    if (fEndCondition === 'on_date' && !fEndDate) { setRecurError('Pick an end date'); return }
    const project = lines.filter(l => l.description).map(l => l.description).join(', ') || 'Services'
    const res = await fetch('/api/recurring-invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: fClient, project, lineItems: lines.filter(l => l.description || l.rate),
        amountMode: fAmountMode, frequency: fFrequency, customInterval: fCustomInterval, customPeriod: fCustomPeriod,
        startDate: fStartDate, endCondition: fEndCondition,
        endAfterOccurrences: fEndCondition === 'after_occurrences' ? fEndAfterOccur : null,
        endDate: fEndCondition === 'on_date' ? fEndDate : null,
        sendTime: fSendTime, clientNotificationEnabled: fClientNotify,
      }),
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); setRecurError(e.error || 'Failed to create recurring invoice'); return }
    const created = await res.json()
    setRecurring(prev => [created, ...prev])
    resetForm(); setShowNew(false)
    setActive('Recurring')
  }

  async function patchTemplate(id: number, body: Record<string, unknown>) {
    const res = await fetch(`/api/recurring-invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const updated = await res.json()
    setRecurring(prev => prev.map(t => t.id === id ? updated : t))
    if (detail?.id === id) setDetail(updated)
    return updated
  }

  const pauseTemplate = (id: number) => patchTemplate(id, { action: 'pause' })
  const unpauseTemplate = (id: number) => patchTemplate(id, { action: 'unpause' })
  async function cancelTemplate(id: number) {
    await patchTemplate(id, { action: 'cancel' })
    setCancelConfirmId(null)
  }

  async function approveDraft(inv: Invoice) {
    if (!inv.recurring_template_id || !(Number(approveAmount) > 0)) return
    const res = await fetch(`/api/recurring-invoices/${inv.recurring_template_id}/approve-draft`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: inv.id, amount: Number(approveAmount) }),
    })
    if (!res.ok) return
    setApproveAmount('')
    const refreshed = await fetch('/api/invoices').then(r => r.json())
    setInvoices(Array.isArray(refreshed) ? refreshed : [])
    setPreview(null)
    fetch('/api/recurring-invoices').then(r => r.json()).then(d => setRecurring(Array.isArray(d) ? d : []))
  }

  const recurPreview = (() => {
    if (!fStartDate) return null
    const today = todayIso()
    let next = fStartDate
    while (next <= today) next = addFrequency(next, fFrequency, fCustomInterval, fCustomPeriod)
    const days = Math.round((parseISO(next).getTime() - parseISO(today).getTime()) / 86400000)
    const dateLabel = format(parseISO(next), 'MMMM d')
    return `This invoice will send ${humanFrequency(fFrequency, fCustomInterval, fCustomPeriod)} starting ${dateLabel} — next send in ${days} day${days !== 1 ? 's' : ''}.`
  })()

  async function setStatus(inv: Invoice, status: Status) {
    setOpenSt(null)
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status } : i))
    if (preview?.id === inv.id) setPreview({ ...inv, status })
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setInvoices(prev => prev.map(i => i.id === inv.id ? updated : i))
    if (preview?.id === inv.id) setPreview(updated)
  }

  async function deleteInvoice(id: string) {
    setOpenMenuId(null)
    setInvoices(prev => prev.filter(i => i.id !== id))
    if (preview?.id === id) setPreview(null)
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
  }

  async function waiveLateFee(inv: Invoice) {
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ late_fee_waived: true }),
    })
    const updated = await res.json()
    setInvoices(prev => prev.map(i => i.id === inv.id ? updated : i))
    if (preview?.id === inv.id) setPreview(updated)
  }

  function updateLine(idx: number, field: keyof LineItem, val: string | number) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: field === 'description' ? val : Number(val) } : l))
  }

  const kpis = [
    { label: 'Total Paid', value: totals.paid, Icon: CheckCircle, accent: '#16A34A', spark: [3200, 5100, 4800, 6900, 5400, totals.paid || 7200], trend: '+14% vs last month', up: true },
    { label: 'Awaiting Payment', value: totals.pending, Icon: Clock, accent: '#D97706', spark: [800, 1200, 950, 1600, 1100, totals.pending || 1400], trend: 'Due soon', up: false },
    { label: 'Overdue', value: totals.overdue, Icon: AlertCircle, accent: '#DC2626', spark: [0, 200, 100, 400, 200, totals.overdue || 300], trend: 'Action required', up: false },
  ]

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Invoicing</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>Create, send, and track payments</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 1px 3px rgba(22,163,74,0.3)' }}
        >
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {/* KPI row */}
      <div className="inv-kpi kpi-bar" style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {kpis.map(({ label, value, Icon, accent, spark, trend, up }, i) => (
          <div key={label} style={{ padding: '24px 28px', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none', borderTop: `2px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={accent} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>${fmt(value)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: up ? '#16A34A' : accent, fontFamily: 'var(--font-body)' }}>{trend}</span>
              <Sparkline values={spark} color={accent} id={i + 20} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>
        <div style={{ display: 'flex', background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          {['All', 'Paid', 'Pending', 'Overdue', 'Draft', 'Recurring'].map(s => {
            const count = s === 'All' ? invoices.length : s === 'Recurring' ? recurring.length : invoices.filter(i => i.status === s).length
            const isActive = activeStatus === s
            return (
              <button
                key={s}
                onClick={() => setActive(s)}
                style={{
                  padding: '8px 14px', background: isActive ? '#16A34A' : 'none',
                  border: 'none', borderLeft: s === 'Recurring' ? '1px solid #F3F4F6' : 'none',
                  color: isActive ? '#fff' : '#6B7280',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {s === 'Recurring' && <RefreshCw size={11} />}
                {s}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: isActive ? 'rgba(255,255,255,0.25)' : '#F3F4F6', color: isActive ? '#fff' : '#9CA3AF' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
          {activeStatus === 'Recurring' ? `${recurring.length} schedule${recurring.length !== 1 ? 's' : ''}` : `${filtered.length} invoice${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Recurring template table */}
      {activeStatus === 'Recurring' && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          {recurLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading…</div>
          ) : recurring.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <RefreshCw size={28} style={{ color: '#E5E7EB', marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', fontFamily: 'var(--font-body)' }}>No recurring invoices yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, fontFamily: 'var(--font-body)' }}>Toggle &ldquo;Recurring&rdquo; on when creating an invoice to set up a schedule</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr>
                    {['Client', 'Amount', 'Frequency', 'Next Send', 'Sends', 'Mode', 'Notify Client', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recurring.map((t, idx) => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: idx < recurring.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }}
                      onClick={() => setDetailId(t.id)}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.color}18`, border: `1.5px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.color, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{t.avatar}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{t.client_name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.project}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                        {t.amount_mode === 'fixed' ? `$${fmt(t.total)}` : <span style={{ color: '#2563EB' }}>Variable</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '3px 9px', borderRadius: 20, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                          {humanFrequency(t.frequency, t.custom_interval, t.custom_period)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                        {t.status === 'active' ? format(parseISO(t.next_send_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#111827', fontWeight: 600, fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>{t.total_sends}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: t.amount_mode === 'fixed' ? '#374151' : '#1D4ED8', background: t.amount_mode === 'fixed' ? '#F3F4F6' : '#EFF6FF', padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>
                          {t.amount_mode}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: t.client_notification_enabled ? '#16A34A' : '#9CA3AF', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                        {t.client_notification_enabled ? 'On' : 'Off'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <RecurStatusBadge status={t.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {t.status === 'active' && (
                            <button onClick={() => pauseTemplate(t.id)} title="Pause"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 7, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                            ><Pause size={10} /> Pause</button>
                          )}
                          {t.status === 'paused' && (
                            <button onClick={() => unpauseTemplate(t.id)} title="Resume"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 7, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                            ><Play size={10} /> Resume</button>
                          )}
                          {(t.status === 'active' || t.status === 'paused') && (
                            <button onClick={() => setCancelConfirmId(t.id)} title="Cancel"
                              style={{ width: 26, height: 26, borderRadius: 7, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#DC2626' }}
                            ><Ban size={12} /></button>
                          )}
                          <button onClick={() => setDetailId(t.id)} style={{ width: 26, height: 26, borderRadius: 7, background: '#F9FAFB', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoice table */}
      {activeStatus !== 'Recurring' && (
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <FileText size={28} style={{ color: '#E5E7EB', marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', fontFamily: 'var(--font-body)' }}>No invoices found</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, fontFamily: 'var(--font-body)' }}>Create your first invoice to get started</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Issued', 'Due', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#16A34A' }}>{inv.id}</span>
                        {inv.recurring_template_id != null && !inv.awaiting_amount && (
                          <span title="Generated by a recurring schedule" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-body)' }}>
                            <RefreshCw size={8} /> Recurring
                          </span>
                        )}
                        {inv.awaiting_amount && (
                          <span title="Variable-amount recurring draft — needs an amount" style={{ fontSize: 9.5, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-body)' }}>
                            Variable
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${inv.color}18`, border: `1.5px solid ${inv.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: inv.color, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{inv.avatar}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{inv.client}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{inv.project}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: inv.late_fee_applied && !inv.late_fee_waived ? '#EF4444' : inv.status === 'Overdue' ? '#DC2626' : '#111827', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          ${fmt(effectiveTotal(inv))}
                        </span>
                        {inv.late_fee_applied && !inv.late_fee_waived && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#EF4444', background: '#EF444410', padding: '2px 7px', borderRadius: 99, letterSpacing: '0.04em', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', border: '1px solid #FECACA' }}>
                            Late Fee Added
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div data-dropdown style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={() => setOpenSt(openStatusId === inv.id ? null : inv.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: statusStyle[inv.status].color, background: statusStyle[inv.status].bg, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >
                          {inv.status} <ChevronDown size={9} />
                        </button>
                        {openStatusId === inv.id && (
                          <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 30, minWidth: 130, overflow: 'hidden' }}>
                            {ALL_STATUSES.map(s => (
                              <button key={s} onClick={() => setStatus(inv, s)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: s === inv.status ? '#F9FAFB' : 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: s === inv.status ? 700 : 400, color: '#111827', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                              >
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusStyle[s].color, flexShrink: 0, display: 'inline-block' }} />
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{inv.issued}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: inv.status === 'Overdue' ? '#DC2626' : '#9CA3AF', fontWeight: inv.status === 'Overdue' ? 700 : 400, whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{inv.due}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setStatus(inv, inv.status === 'Draft' ? 'Pending' : 'Paid')}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 7, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                          >
                            {inv.status === 'Draft' ? <><Send size={10} /> Send</> : <><CheckCircle size={10} /> Mark paid</>}
                          </button>
                        )}
                        <button
                          onClick={() => setPreview(inv)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: '#F9FAFB', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}
                        >
                          <Eye size={13} />
                        </button>
                        <div data-dropdown style={{ position: 'relative' }}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#F9FAFB', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF' }}
                          >
                            <MoreHorizontal size={13} />
                          </button>
                          {openMenuId === inv.id && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 5px)', background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 30, minWidth: 130, overflow: 'hidden' }}>
                              <button onClick={() => deleteInvoice(inv.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '9px 13px', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Preview drawer */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setPreview(null)}>
          <div
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.1)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#111827' }}>Invoice Details</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={17} /></button>
            </div>

            <div style={{ flex: 1, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Branded header */}
              <div style={{ background: 'linear-gradient(135deg, #14532D, #16A34A)', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Invoice</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>{preview.id}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {preview.status}
                  </span>
                </div>
              </div>

              {/* Bill to */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Bill To</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${preview.color}18`, border: `2px solid ${preview.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: preview.color, fontFamily: 'var(--font-display)', flexShrink: 0 }}>{preview.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)' }}>{preview.client}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: 'var(--font-body)' }}>{preview.project}</div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ lbl: 'Issue Date', val: preview.issued }, { lbl: 'Due Date', val: preview.due }].map(({ lbl, val }) => (
                  <div key={lbl} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 13px', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{lbl}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Amount — reflects late fee total when applicable */}
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '18px 20px', border: `1px solid ${preview.late_fee_applied && !preview.late_fee_waived ? '#FECACA' : '#F3F4F6'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Total Due</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: preview.late_fee_applied && !preview.late_fee_waived ? '#EF4444' : '#111827', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmt(effectiveTotal(preview))}
                  </div>
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${preview.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: preview.color, fontFamily: 'var(--font-display)' }}>{preview.avatar}</div>
              </div>

              {/* Variable-amount recurring draft — needs member input before it can fire */}
              {preview.awaiting_amount && (
                <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 18px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 10, fontFamily: 'var(--font-body)' }}>Variable Amount — Needs Your Input</div>
                  <p style={{ fontSize: 12.5, color: '#1E3A8A', fontFamily: 'var(--font-body)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    This recurring invoice draft is waiting for you to set the amount before it sends to {preview.client}.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF' }}>$</span>
                      <input type="number" min="0" placeholder="0.00" value={approveAmount} onChange={e => setApproveAmount(e.target.value)}
                        style={{ ...inputStyle, background: 'white', paddingLeft: 20 }} />
                    </div>
                    <button onClick={() => approveDraft(preview)} disabled={!(Number(approveAmount) > 0)}
                      style={{ padding: '9px 16px', background: Number(approveAmount) > 0 ? '#16A34A' : '#E5E7EB', color: Number(approveAmount) > 0 ? 'white' : '#9CA3AF', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: Number(approveAmount) > 0 ? 'pointer' : 'default', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                    >Confirm &amp; Send</button>
                  </div>
                </div>
              )}

              {/* Late Fee section */}
              {preview.late_fee_applied && !preview.late_fee_waived && (
                <div style={{ background: '#FFF5F5', borderRadius: 12, padding: '16px 18px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#EF4444', marginBottom: 12, fontFamily: 'var(--font-body)' }}>Late Payment Fee</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                      <span>Original Total</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>${fmt(preview.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#EF4444', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      <span>Late Fee ({preview.late_fee_percentage}%)</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>+${fmt(preview.late_fee_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#EF4444', borderTop: '1px solid #FECACA', paddingTop: 9, marginTop: 2, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                      <span>New Total</span>
                      <span>${fmt(preview.amount + preview.late_fee_amount)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => waiveLateFee(preview)}
                    style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Waive Fee
                  </button>
                </div>
              )}

              {/* Late fee waived confirmation */}
              {preview.late_fee_waived && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
                  <CheckCircle size={13} color="#16A34A" />
                  <span style={{ fontSize: 12.5, color: '#16A34A', fontWeight: 600, fontFamily: 'var(--font-body)' }}>Late fee waived</span>
                </div>
              )}

              {/* Status change */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Change Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_STATUSES.map(s => {
                    const active = s === preview.status
                    return (
                      <button key={s} onClick={() => setStatus(preview, s)}
                        style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? statusStyle[s].color : '#F3F4F6'}`, background: active ? statusStyle[s].bg : 'transparent', color: active ? statusStyle[s].color : '#9CA3AF', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {preview.status !== 'Paid' && (
                <button
                  onClick={() => setStatus(preview, preview.status === 'Draft' ? 'Pending' : 'Paid')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: 12, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  {preview.status === 'Draft' ? <><Send size={14} /> Send Invoice</> : <><CheckCircle size={14} /> Mark as Paid</>}
                </button>
              )}

              <button
                onClick={() => deleteInvoice(preview.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 10, background: 'none', border: '1px solid #FCA5A5', borderRadius: 10, cursor: 'pointer', color: '#DC2626', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                <Trash2 size={13} /> Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring schedule detail drawer */}
      {detailId != null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setDetailId(null)}>
          <div
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 440, background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.1)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#111827' }}>Recurring Schedule</span>
              <button onClick={() => setDetailId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={17} /></button>
            </div>

            {!detail ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading…</div>
            ) : (
              <div style={{ flex: 1, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ background: 'linear-gradient(135deg, #14532D, #16A34A)', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Recurring To</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: '#fff' }}>{detail.client_name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{detail.project}</div>
                    </div>
                    <RecurStatusBadge status={detail.status} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Amount</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>
                      {detail.amount_mode === 'fixed' ? `$${fmt(detail.total)}` : 'Variable'}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Frequency</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)' }}>
                      {humanFrequency(detail.frequency, detail.custom_interval, detail.custom_period)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Start date', value: format(parseISO(detail.start_date), 'MMM d, yyyy') },
                    { label: 'Send time', value: detail.send_time },
                    { label: 'End condition', value: detail.end_condition === 'indefinite' ? 'Indefinitely' : detail.end_condition === 'after_occurrences' ? `After ${detail.end_after_occurrences} occurrences` : `On ${detail.end_date ? format(parseISO(detail.end_date), 'MMM d, yyyy') : '—'}` },
                    { label: 'Total sends', value: String(detail.total_sends) },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                      <span style={{ fontSize: 12.5, color: '#6B7280', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {detail.status === 'active' && detail.upcoming.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Next 3 Occurrences</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detail.upcoming.map((d, i) => (
                        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: '#F0FDF4', borderRadius: 9, border: '1px solid #BBF7D0' }}>
                          <Clock size={12} color="#16A34A" />
                          <span style={{ fontSize: 12.5, color: '#15803D', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{format(parseISO(d), 'EEEE, MMMM d, yyyy')}</span>
                          {i === 0 && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#16A34A' }}>NEXT</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.logs && detail.logs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <History size={11} /> Schedule History
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detail.logs.map(log => {
                        const logStyle = log.status === 'success' ? { color: '#15803D', bg: '#F0FDF4', label: 'Sent' }
                          : log.status === 'failed' ? { color: '#DC2626', bg: '#FEF2F2', label: 'Failed' }
                          : { color: '#1D4ED8', bg: '#EFF6FF', label: 'Awaiting amount' }
                        return (
                          <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: 9, border: '1px solid #F3F4F6' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{format(parseISO(log.scheduled_date), 'MMM d, yyyy')}</div>
                              {log.invoice_id && <div style={{ fontSize: 10.5, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 1 }}>{log.invoice_id}</div>}
                              {log.error_message && <div style={{ fontSize: 10.5, color: '#DC2626', fontFamily: 'var(--font-body)', marginTop: 2 }}>{log.error_message}</div>}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: logStyle.color, background: logStyle.bg, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{logStyle.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Notify client when invoice sends</span>
                  <button onClick={() => patchTemplate(detail.id, { client_notification_enabled: !detail.client_notification_enabled })}
                    style={{ width: 36, height: 20, borderRadius: 99, background: detail.client_notification_enabled ? '#16A34A' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: detail.client_notification_enabled ? 19 : 3, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                  </button>
                </div>

                {(detail.status === 'active' || detail.status === 'paused') && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {detail.status === 'active' ? (
                      <button onClick={() => pauseTemplate(detail.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        <Pause size={13} /> Pause
                      </button>
                    ) : (
                      <button onClick={() => unpauseTemplate(detail.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        <Play size={13} /> Resume
                      </button>
                    )}
                    <button onClick={() => setCancelConfirmId(detail.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, background: 'none', border: '1px solid #FCA5A5', borderRadius: 10, cursor: 'pointer', color: '#DC2626', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      <Ban size={13} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {cancelConfirmId != null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }} onClick={() => setCancelConfirmId(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 400, padding: 26, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ban size={20} color="#DC2626" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Cancel this recurring schedule?</div>
            <p style={{ fontSize: 13.5, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 22 }}>
              This will permanently end this recurring schedule. Historical invoices are preserved. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setCancelConfirmId(null)} style={{ padding: '9px 16px', background: 'white', border: '1px solid #F3F4F6', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Keep schedule</button>
              <button onClick={() => cancelTemplate(cancelConfirmId)} style={{ padding: '9px 16px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Yes, cancel it</button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => { setShowNew(false); resetForm() }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 26px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>New Invoice</span>
              <button onClick={() => { setShowNew(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Client', el: <input style={inputStyle} placeholder="Client name" value={fClient} onChange={e => setFClient(e.target.value)} /> },
                  { label: 'Issue Date', el: <input type="date" style={inputStyle} value={fIssued} onChange={e => setFIssued(e.target.value)} /> },
                  { label: 'Due Date', el: <input type="date" style={inputStyle} value={fDue} onChange={e => setFDue(e.target.value)} /> },
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>{label}</label>
                    {el}
                  </div>
                ))}
              </div>

              {/* Recurring */}
              <div style={{ border: '1px solid #F3F4F6', borderRadius: 12, padding: '16px 18px', background: fRecurring ? '#FAFAFA' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fRecurring ? 18 : 0 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={13} color="#16A34A" /> Recurring Invoice
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Send this invoice automatically on a repeating schedule</div>
                  </div>
                  <button
                    onClick={() => setFRecurring(v => !v)}
                    style={{ width: 44, height: 24, borderRadius: 99, background: fRecurring ? '#16A34A' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }}
                    aria-pressed={fRecurring}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: fRecurring ? 23 : 3, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                  </button>
                </div>

                {fRecurring && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Frequency */}
                    <div style={{ display: 'grid', gridTemplateColumns: fFrequency === 'custom' ? '1.4fr 0.8fr 1fr' : '1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Frequency</label>
                        <select value={fFrequency} onChange={e => setFFrequency(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {fFrequency === 'custom' && (
                        <>
                          <div>
                            <label style={labelStyle}>Every</label>
                            <input type="number" min={1} value={fCustomInterval} onChange={e => setFCustomInterval(Math.max(1, Number(e.target.value) || 1))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Period</label>
                            <select value={fCustomPeriod} onChange={e => setFCustomPeriod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                              <option value="months">Months</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Start date + send time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Start Date</label>
                        <input type="date" value={fStartDate} onChange={e => setFStartDate(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Send Time</label>
                        <input type="time" value={fSendTime} onChange={e => setFSendTime(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* End condition */}
                    <div>
                      <label style={labelStyle}>End</label>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <RadioRow checked={fEndCondition === 'indefinite'} onClick={() => setFEndCondition('indefinite')} label="Send indefinitely" />
                        <RadioRow checked={fEndCondition === 'after_occurrences'} onClick={() => setFEndCondition('after_occurrences')} label="End after">
                          {fEndCondition === 'after_occurrences' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                              <input type="number" min={1} value={fEndAfterOccur} onChange={e => setFEndAfterOccur(Math.max(1, Number(e.target.value) || 1))} style={{ ...inputStyle, width: 64, padding: '6px 8px' }} />
                              <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>occurrences</span>
                            </div>
                          )}
                        </RadioRow>
                        <RadioRow checked={fEndCondition === 'on_date'} onClick={() => setFEndCondition('on_date')} label="End on date">
                          {fEndCondition === 'on_date' && (
                            <input type="date" value={fEndDate} min={fStartDate} onChange={e => setFEndDate(e.target.value)} style={{ ...inputStyle, width: 160, padding: '6px 8px', marginLeft: 6 }} />
                          )}
                        </RadioRow>
                      </div>
                    </div>

                    {/* Amount mode */}
                    <div>
                      <label style={labelStyle}>Amount Mode</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {([
                          { v: 'fixed' as const, title: 'Fixed Amount', desc: 'Fully automatic — fires with the set amount' },
                          { v: 'variable' as const, title: 'Variable Amount', desc: 'Drafts 48h before send — you fill in the amount' },
                        ]).map(opt => (
                          <button key={opt.v} type="button" onClick={() => setFAmountMode(opt.v)}
                            style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${fAmountMode === opt.v ? '#16A34A' : '#F3F4F6'}`, background: fAmountMode === opt.v ? '#F0FDF4' : 'white', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${fAmountMode === opt.v ? '#16A34A' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {fAmountMode === opt.v && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />}
                              </div>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)' }}>{opt.title}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', lineHeight: 1.4, marginLeft: 21 }}>{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Client notification toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Notify client when invoice sends</span>
                      <button onClick={() => setFClientNotify(v => !v)} style={{ width: 36, height: 20, borderRadius: 99, background: fClientNotify ? '#16A34A' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }} aria-pressed={fClientNotify}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: fClientNotify ? 19 : 3, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                      </button>
                    </div>

                    {/* Live preview */}
                    {recurPreview && (
                      <div style={{ fontSize: 13, color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: 500, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, padding: '9px 13px', lineHeight: 1.5 }}>
                        {recurPreview}
                      </div>
                    )}

                    {recurError && (
                      <div style={{ fontSize: 12.5, color: '#DC2626', fontFamily: 'var(--font-body)' }}>{recurError}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Line Items</div>
                <div style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 100px 80px 28px', background: '#FAFAFA', padding: '8px 12px', borderBottom: '1px solid #F3F4F6' }}>
                    {['Description', 'Qty', 'Rate', 'Total', ''].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{h}</div>
                    ))}
                  </div>
                  {lines.map((line, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 100px 80px 28px', padding: '8px 12px', borderBottom: idx < lines.length - 1 ? '1px solid #F3F4F6' : 'none', alignItems: 'center', gap: 6 }}>
                      <input className="search-input" placeholder="Service description" value={line.description}
                        onChange={e => updateLine(idx, 'description', e.target.value)}
                        style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'var(--font-body)', width: '100%' }} />
                      <input type="number" min="1" value={line.qty}
                        onChange={e => updateLine(idx, 'qty', e.target.value)}
                        style={{ border: 'none', background: 'transparent', padding: '4px 6px', fontSize: 13, textAlign: 'center', color: '#111827', outline: 'none', fontFamily: 'var(--font-body)', width: '100%' }} />
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF', pointerEvents: 'none' }}>$</span>
                        <input type="number" min="0" value={line.rate || ''} placeholder="0"
                          onChange={e => updateLine(idx, 'rate', e.target.value)}
                          style={{ border: 'none', background: 'transparent', padding: '4px 8px 4px 18px', fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-body)' }}>
                        ${fmt(line.qty * line.rate)}
                      </div>
                      <button
                        onClick={() => setLines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      ><X size={12} /></button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setLines(prev => [...prev, emptyLine()])}
                  style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', fontSize: 12.5, fontWeight: 600, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)' }}
                >
                  <Plus size={12} /> Add line item
                </button>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Notes / Payment Terms</label>
                <textarea
                  placeholder="e.g. Payment due within 30 days." rows={2}
                  value={fNotes} onChange={e => setFNotes(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Late Fees */}
              <div style={{ border: '1px solid #F3F4F6', borderRadius: 12, padding: '16px 18px', background: fLateFeeEnabled ? '#FAFAFA' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fLateFeeEnabled ? 16 : 0 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Late Payment Fees</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Auto-charge a fee if payment is overdue</div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setFLateFeeEnabled(v => !v)}
                    style={{ width: 44, height: 24, borderRadius: 99, background: fLateFeeEnabled ? '#16A34A' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }}
                    aria-pressed={fLateFeeEnabled}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: fLateFeeEnabled ? 23 : 3, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                  </button>
                </div>
                {fLateFeeEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Fee Percentage</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number" min="0.1" max="25" step="0.1"
                          value={fLateFeePercentage}
                          onChange={e => setFLateFeePercentage(parseFloat(e.target.value) || 1.5)}
                          style={{ ...inputStyle, paddingRight: 30 }}
                        />
                        <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF', pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>%</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Grace Period</label>
                      <select
                        value={fLateFeeDays}
                        onChange={e => setFLateFeeDays(Number(e.target.value))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value={15}>15 days</option>
                        <option value={30}>30 days</option>
                        <option value={45}>45 days</option>
                        <option value={60}>60 days</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                      A {fLateFeePercentage}% fee will be added automatically if payment is not received within {fLateFeeDays} days of the due date.
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12.5, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                    <span>Subtotal</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>${fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F3F4F6', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    <span>Total</span>
                    <span style={{ color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>${fmt(subtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {!fRecurring && (
                  <button
                    onClick={() => createInvoice('Draft')}
                    style={{ padding: '10px 18px', background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >Save Draft</button>
                )}
                <button
                  onClick={() => fRecurring ? createRecurringInvoice() : createInvoice('Pending')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >{fRecurring ? <><RefreshCw size={13} /> Create Recurring Invoice</> : <><Send size={13} /> Send Invoice</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
