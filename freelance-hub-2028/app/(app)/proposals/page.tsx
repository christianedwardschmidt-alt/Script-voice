'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Eye, Send, Check, X, Trash2, MoreHorizontal,
  RefreshCw, FileText, TrendingUp, DollarSign, Clock,
  ChevronDown, Copy, ExternalLink,
} from 'lucide-react'

interface Proposal {
  id: number
  title: string
  client_name: string
  client_email: string
  project_type: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'
  total: number
  sent_at: string | null
  accepted_at: string | null
  declined_at: string | null
  view_count: number
  last_viewed_at: string | null
  share_token: string
  valid_until: string | null
  created_at: string
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function relDate(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    bg: '#F3F4F6', color: '#6B7280',  dot: '#9CA3AF' },
  sent:     { label: 'Sent',     bg: '#EFF6FF', color: '#2563EB',  dot: '#3B82F6' },
  viewed:   { label: 'Viewed',   bg: '#FFFBEB', color: '#D97706',  dot: '#F59E0B' },
  accepted: { label: 'Accepted', bg: '#F0FDF4', color: 'var(--accent-brand)',  dot: '#22C55E' },
  declined: { label: 'Declined', bg: '#FFF1F2', color: '#DC2626',  dot: '#EF4444' },
  expired:  { label: 'Expired',  bg: '#F3F4F6', color: '#9CA3AF',  dot: '#D1D5DB' },
}

const TABS = ['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Declined'] as const
type Tab = typeof TABS[number]

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const w = 60, h = 28, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v / max) * (h - pad * 2))
    return `${x},${y}`
  }).join(' ')
  const area = `M${pts.split(' ')[0]} L${pts} L${w - pad},${h - pad} L${pad},${h - pad} Z`
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {(() => { const [lx,ly] = (pts.split(' ').pop() || '').split(','); return lx && ly ? <circle cx={lx} cy={ly} r="2.5" fill={color} /> : null })()}
    </svg>
  )
}

export default function ProposalsPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'info' } | null>(null)
  const [viewedToast, setViewedToast] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/proposals')
    if (res.ok) setProposals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Poll for "viewed" status changes every 20 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/proposals')
      if (!res.ok) return
      const fresh: Proposal[] = await res.json()
      const prev = new Map(proposals.map(p => [p.id, p.status]))
      for (const p of fresh) {
        if (p.status === 'viewed' && prev.get(p.id) === 'sent') {
          setViewedToast(`${p.client_name || 'Your client'} just viewed your proposal`)
          setTimeout(() => setViewedToast(null), 6000)
          setProposals(fresh)
          return
        }
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [proposals])

  const createNew = async () => {
    setCreating(true)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Proposal' }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/proposals/${data.id}`)
    }
    setCreating(false)
  }

  const deleteProposal = async (id: number) => {
    setMenuOpen(null)
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
    setProposals(p => p.filter(x => x.id !== id))
    showToast('Proposal deleted', 'info')
  }

  const duplicateProposal = async (p: Proposal) => {
    setMenuOpen(null)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${p.title} (Copy)`,
        client_name: p.client_name,
        client_email: p.client_email,
        project_type: p.project_type,
      }),
    })
    if (res.ok) {
      await load()
      showToast('Proposal duplicated')
    }
  }

  const copyLink = (token: string) => {
    setMenuOpen(null)
    const url = `${window.location.origin}/p/${token}`
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!'))
  }

  // Stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const sentThisMonth = proposals.filter(p => p.sent_at && p.sent_at >= monthStart).length
  const totalSentAll = proposals.filter(p => p.status !== 'draft').length
  const totalAccepted = proposals.filter(p => p.status === 'accepted').length
  const acceptanceRate = totalSentAll > 0 ? Math.round((totalAccepted / totalSentAll) * 100) : 0
  const withValue = proposals.filter(p => p.total > 0)
  const avgValue = withValue.length > 0 ? withValue.reduce((s, p) => s + p.total, 0) / withValue.length : 0
  const openValue = proposals.filter(p => ['sent', 'viewed'].includes(p.status)).reduce((s, p) => s + p.total, 0)

  const kpis = [
    { label: 'Sent This Month',  value: String(sentThisMonth),     spark: [0,1,1,2,2,sentThisMonth], color: '#6366F1' },
    { label: 'Acceptance Rate',  value: `${acceptanceRate}%`,      spark: [0,30,45,55,acceptanceRate*.9,acceptanceRate].map(Math.round), color: 'var(--accent-brand)' },
    { label: 'Avg Proposal Value', value: avgValue > 0 ? fmt(avgValue) : '—', spark: [1200,2800,3500,4200,avgValue*.8,avgValue].map(Math.round), color: '#D97706' },
    { label: 'Open Value',       value: openValue > 0 ? fmt(openValue) : '—', spark: [0,2000,5000,openValue*.5,openValue*.8,openValue].map(Math.round), color: '#0EA5E9' },
  ]

  const filtered = proposals.filter(p =>
    activeTab === 'All' || p.status === activeTab.toLowerCase()
  )

  return (
    <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 52px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .prop-row:hover { background: #F8FAFC !important; }
        .menu-item:hover { background: #F3F4F6 !important; }
        .tab-btn:hover { color: #374151 !important; }
      `}</style>

      {/* Viewed toast */}
      {viewedToast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: 12,
          fontSize: 14, fontWeight: 500, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          {viewedToast}
        </div>
      )}

      {/* Generic toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 10,
          fontSize: 14, fontWeight: 500, zIndex: 999, animation: 'fadeIn 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* Click away menu close */}
      {menuOpen !== null && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(null)} />}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Proposals</h1>
          <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>Create, send, and track proposals that win clients.</p>
        </div>
        <button
          onClick={createNew}
          disabled={creating}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', border: 'none', borderRadius: 10, background: 'var(--accent-brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(var(--accent-brand-rgb),0.35)', flexShrink: 0 }}
        >
          {creating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
          New Proposal
        </button>
      </div>

      {/* KPI stat bar */}
      {!loading && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
          {kpis.map((kpi, i) => (
            <div key={kpi.label} style={{ padding: '20px 22px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF' }}>{kpi.label}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>{kpi.value}</div>
                <Sparkline values={kpi.spark} color={kpi.color} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #E9EBF0', marginBottom: 20 }}>
        {TABS.map(tab => {
          const count = tab === 'All' ? proposals.length : proposals.filter(p => p.status === tab.toLowerCase()).length
          return (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 14px', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#111827' : '#6B7280',
                borderBottom: activeTab === tab ? '2px solid var(--accent-brand)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab}
              {count > 0 && (
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: activeTab === tab ? '#F0FDF4' : '#F3F4F6', color: activeTab === tab ? 'var(--accent-brand)' : '#9CA3AF', fontWeight: 600 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <RefreshCw size={22} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(var(--accent-brand-rgb),0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={28} color="var(--accent-brand)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
            {activeTab === 'All' ? 'No proposals yet' : `No ${activeTab.toLowerCase()} proposals`}
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>Create your first proposal to start winning clients.</p>
          <button onClick={createNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: 'none', borderRadius: 9, background: 'var(--accent-brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> New Proposal
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F3F4F6' }}>
                  {['Proposal', 'Client', 'Value', 'Status', 'Sent', 'Views', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft
                  const isExpired = p.valid_until && new Date(p.valid_until) < new Date() && p.status === 'sent'
                  return (
                    <tr
                      key={p.id}
                      className="prop-row"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
                      onClick={() => router.push(`/proposals/${p.id}`)}
                    >
                      <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isExpired ? 'line-through' : 'none', color: isExpired ? '#9CA3AF' : '#111827' }}>
                          {p.title}
                        </div>
                        {p.project_type && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{p.project_type}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                        <div>{p.client_name || <span style={{ color: '#9CA3AF' }}>—</span>}</div>
                        {p.client_email && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{p.client_email}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#111827', fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {p.total > 0 ? fmt(p.total) : <span style={{ color: '#9CA3AF' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {isExpired ? 'Expired' : sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {relDate(p.sent_at)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {p.view_count > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: p.status === 'viewed' ? '#D97706' : '#6B7280' }}>
                            <Eye size={12} /> {p.view_count}
                          </span>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 12px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <MoreHorizontal size={14} color="#6B7280" />
                        </button>
                        {menuOpen === p.id && (
                          <div style={{ position: 'absolute', right: 12, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 168, padding: '4px 0', animation: 'fadeIn 0.1s ease' }}>
                            {[
                              { icon: <ExternalLink size={13} />, label: 'Open builder', action: () => { setMenuOpen(null); router.push(`/proposals/${p.id}`) } },
                              { icon: <Copy size={13} />, label: 'Copy client link', action: () => copyLink(p.share_token) },
                              { icon: <Copy size={13} />, label: 'Duplicate', action: () => duplicateProposal(p) },
                              { icon: <Trash2 size={13} />, label: 'Delete', action: () => deleteProposal(p.id), danger: true },
                            ].map(item => (
                              <button key={item.label} className="menu-item" onClick={item.action}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer', color: (item as { danger?: boolean }).danger ? '#DC2626' : '#374151', textAlign: 'left' }}>
                                {item.icon} {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
