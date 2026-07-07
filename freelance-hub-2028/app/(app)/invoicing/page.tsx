'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Search, Send, Eye, CheckCircle, Clock,
  AlertCircle, X, Trash2, ChevronDown, FileText, MoreHorizontal,
} from 'lucide-react'

type Status = 'Paid' | 'Pending' | 'Overdue' | 'Draft'

const statusClass: Record<Status, string> = {
  Paid:    'badge badge-completed',
  Pending: 'badge badge-inprogress',
  Overdue: 'badge badge-high',
  Draft:   'badge badge-todo',
}

const ALL_STATUSES: Status[] = ['Draft', 'Pending', 'Overdue', 'Paid']

interface Invoice {
  id: string; client: string; project: string
  amount: number; status: Status
  issued: string; due: string; avatar: string; color: string
}

interface LineItem { description: string; qty: number; rate: number }

const AVATARS = ['👩🏻‍💼','👨🏻‍💻','👩🏿‍💼','👨🏽‍💼','👩🏽‍🎨','👨🏾‍💻']
const COLORS  = ['#16a34a','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6']

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function todayIso() { return new Date().toISOString().split('T')[0] }
function emptyLine(): LineItem { return { description: '', qty: 1, rate: 0 } }

const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 5 }
const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7,
  background: 'var(--bg)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-2)',
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

  // Form state
  const [fClient, setFClient] = useState('')
  const [fIssued, setFIssued] = useState(todayIso())
  const [fDue,    setFDue]    = useState('')
  const [fNotes,  setFNotes]  = useState('')
  const [lines,   setLines]   = useState<LineItem[]>([emptyLine()])

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function close(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('.dropdown-anchor')) {
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

  function resetForm() { setFClient(''); setFIssued(todayIso()); setFDue(''); setFNotes(''); setLines([emptyLine()]) }

  async function createInvoice(status: Status) {
    if (!fClient.trim() || subtotal <= 0) return
    const project = lines.filter(l => l.description).map(l => l.description).join(', ') || 'Services'
    const avatar  = AVATARS[invoices.length % AVATARS.length]
    const color   = COLORS[invoices.length % COLORS.length]
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: fClient, project, amount: subtotal, status, issued: fIssued, due: fDue, avatar, color }),
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

  function updateLine(idx: number, field: keyof LineItem, val: string | number) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: field === 'description' ? val : Number(val) } : l))
  }

  return (
    <div style={{ padding: 28, background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Invoicing</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>Create, send, and track payments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={14} /> New Invoice</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Total Paid',        value: totals.paid,    Icon: CheckCircle, accent: '#10b981' },
          { label: 'Awaiting Payment',  value: totals.pending, Icon: Clock,       accent: '#d97706' },
          { label: 'Overdue',           value: totals.overdue, Icon: AlertCircle, accent: '#dc2626' },
        ].map(({ label: lbl, value, Icon, accent }) => (
          <div key={lbl} className="card" style={{ padding: '16px 20px', borderTop: `2px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>{lbl}</div>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>${fmt(value)}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: accent + '14', border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={accent} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="search-input" placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map(s => {
            const count = s === 'All' ? invoices.length : invoices.filter(i => i.status === s).length
            return (
              <button key={s} className={`tab-btn${activeStatus === s ? ' active' : ''}`} onClick={() => setActive(s)}>
                {s}
                <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: activeStatus === s ? 'rgba(255,255,255,0.25)' : 'var(--bg-3)', color: activeStatus === s ? 'inherit' : 'var(--text-3)' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 52, textAlign: 'center' }}>
            <FileText size={28} style={{ color: 'var(--text-3)', marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>No invoices found</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Create your first invoice to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Issued', 'Due', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 9.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{inv.id}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: inv.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{inv.avatar}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{inv.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-2)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.project}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: inv.status === 'Overdue' ? '#dc2626' : 'var(--text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>${fmt(inv.amount)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="dropdown-anchor" style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className={statusClass[inv.status]}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setOpenSt(openStatusId === inv.id ? null : inv.id)}
                      >
                        {inv.status} <ChevronDown size={9} />
                      </button>
                      {openStatusId === inv.id && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, minWidth: 120, overflow: 'hidden' }}>
                          {ALL_STATUSES.map(s => (
                            <button key={s} onClick={() => setStatus(inv, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: s === inv.status ? 'var(--bg-3)' : 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: s === inv.status ? 700 : 400, color: 'var(--text)', textAlign: 'left', fontFamily: 'inherit' }}>
                              <span className={statusClass[s]} style={{ width: 6, height: 6, padding: 0, borderRadius: '50%', display: 'inline-block' }} />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{inv.issued}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: inv.status === 'Overdue' ? '#dc2626' : 'var(--text-3)', fontWeight: inv.status === 'Overdue' ? 700 : 400, whiteSpace: 'nowrap' }}>{inv.due}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => setStatus(inv, inv.status === 'Draft' ? 'Pending' : 'Paid')}
                          className="btn-primary"
                          style={{ fontSize: 10.5, padding: '4px 9px', gap: 4, whiteSpace: 'nowrap' }}
                        >
                          {inv.status === 'Draft' ? <><Send size={10} /> Send</> : <><CheckCircle size={10} /> Mark paid</>}
                        </button>
                      )}
                      <button style={iconBtn} onClick={() => setPreview(inv)}><Eye size={13} /></button>
                      <div className="dropdown-anchor" style={{ position: 'relative' }}>
                        <button style={iconBtn} onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}><MoreHorizontal size={13} /></button>
                        {openMenuId === inv.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, minWidth: 120, overflow: 'hidden' }}>
                            <button onClick={() => deleteInvoice(inv.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 12.5, fontFamily: 'inherit' }}>
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
        )}
      </div>

      {/* ── Preview panel ───────────────────────────────── */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setPreview(null)}>
          <div
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, background: 'var(--card)', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Invoice details</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={17} /></button>
            </div>
            <div style={{ flex: 1, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Branded header */}
              <div style={{ background: 'linear-gradient(135deg, #007a3a, #00b857)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>Invoice</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{preview.id}</div>
                </div>
                <span className={statusClass[preview.status]} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>{preview.status}</span>
              </div>

              {/* Bill to */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Bill To</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: preview.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{preview.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{preview.client}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{preview.project}</div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ lbl: 'Issue Date', val: preview.issued }, { lbl: 'Due Date', val: preview.due }].map(({ lbl, val }) => (
                  <div key={lbl} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Amount */}
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Total Due</div>
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>${fmt(preview.amount)}</div>
                </div>
                <div style={{ fontSize: 34 }}>{preview.avatar}</div>
              </div>

              {/* Change status */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Change Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(preview, s)}
                      className={s === preview.status ? statusClass[s] : 'badge badge-todo'}
                      style={{ cursor: 'pointer', opacity: s === preview.status ? 1 : 0.6, padding: '5px 10px', fontSize: 11.5, fontWeight: s === preview.status ? 700 : 500 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary action */}
              {preview.status !== 'Paid' && (
                <button className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '11px' }} onClick={() => setStatus(preview, preview.status === 'Draft' ? 'Pending' : 'Paid')}>
                  {preview.status === 'Draft' ? <><Send size={14} /> Send Invoice</> : <><CheckCircle size={14} /> Mark as Paid</>}
                </button>
              )}
              <button
                onClick={() => deleteInvoice(preview.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px', background: 'none', border: '1px solid #fca5a5', borderRadius: 9, cursor: 'pointer', color: '#dc2626', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
              >
                <Trash2 size={13} /> Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Invoice Modal ──────────────────────────── */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => { setShowNew(false); resetForm() }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>New Invoice</div>
              <button onClick={() => { setShowNew(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Client + dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={label}>Client</label>
                  <input className="search-input" style={{ paddingLeft: 12 }} placeholder="Client name" value={fClient} onChange={e => setFClient(e.target.value)} />
                </div>
                <div>
                  <label style={label}>Issue Date</label>
                  <input type="date" className="search-input" style={{ paddingLeft: 12 }} value={fIssued} onChange={e => setFIssued(e.target.value)} />
                </div>
                <div>
                  <label style={label}>Due Date</label>
                  <input type="date" className="search-input" style={{ paddingLeft: 12 }} value={fDue} onChange={e => setFDue(e.target.value)} />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Line Items</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 100px 80px 28px', background: 'var(--bg)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    {['Description', 'Qty', 'Rate', 'Total', ''].map(h => (
                      <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</div>
                    ))}
                  </div>
                  {lines.map((line, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 100px 80px 28px', padding: '8px 12px', borderBottom: idx < lines.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', gap: 6 }}>
                      <input
                        className="search-input" placeholder="Service description" value={line.description}
                        onChange={e => updateLine(idx, 'description', e.target.value)}
                        style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                      />
                      <input
                        type="number" min="1" className="search-input" value={line.qty}
                        onChange={e => updateLine(idx, 'qty', e.target.value)}
                        style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 6px', fontSize: 13, textAlign: 'center' }}
                      />
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-3)', pointerEvents: 'none' }}>$</span>
                        <input
                          type="number" min="0" className="search-input"
                          value={line.rate || ''}
                          placeholder="0"
                          onChange={e => updateLine(idx, 'rate', e.target.value)}
                          style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 8px 4px 18px', fontSize: 13 }}
                        />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        ${fmt(line.qty * line.rate)}
                      </div>
                      <button
                        onClick={() => setLines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setLines(prev => [...prev, emptyLine()])}
                  style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 12.5, fontWeight: 600, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
                >
                  <Plus size={12} /> Add line item
                </button>
              </div>

              {/* Notes */}
              <div>
                <label style={label}>Notes / Payment Terms</label>
                <textarea
                  className="search-input" placeholder="e.g. Payment due within 30 days. Thank you for your business." rows={2}
                  value={fNotes} onChange={e => setFNotes(e.target.value)}
                  style={{ paddingLeft: 12, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Total */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
                    <span>Subtotal</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>${fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>
                    <span>Total</span>
                    <span style={{ color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>${fmt(subtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-outline" onClick={() => createInvoice('Draft')}>Save Draft</button>
                <button className="btn-primary" onClick={() => createInvoice('Pending')}><Send size={13} /> Send Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
