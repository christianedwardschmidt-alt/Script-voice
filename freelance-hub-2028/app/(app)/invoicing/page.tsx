'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Search, Send, Eye, CheckCircle, Clock,
  AlertCircle, X, Trash2, ChevronDown, FileText, MoreHorizontal,
} from 'lucide-react'

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
}
interface LineItem { description: string; qty: number; rate: number }

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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: '#F9FAFB', border: '1px solid #F3F4F6',
  borderRadius: 10, fontSize: 13, color: '#111827',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
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

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json())
      .then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

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
          {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map(s => {
            const count = s === 'All' ? invoices.length : invoices.filter(i => i.status === s).length
            const isActive = activeStatus === s
            return (
              <button
                key={s}
                onClick={() => setActive(s)}
                style={{
                  padding: '8px 14px', background: isActive ? '#16A34A' : 'none',
                  border: 'none', color: isActive ? '#fff' : '#6B7280',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {s}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: isActive ? 'rgba(255,255,255,0.25)' : '#F3F4F6', color: isActive ? '#fff' : '#9CA3AF' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Invoice table */}
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
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#16A34A', whiteSpace: 'nowrap' }}>{inv.id}</td>
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
                <button
                  onClick={() => createInvoice('Draft')}
                  style={{ padding: '10px 18px', background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >Save Draft</button>
                <button
                  onClick={() => createInvoice('Pending')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                ><Send size={13} /> Send Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
