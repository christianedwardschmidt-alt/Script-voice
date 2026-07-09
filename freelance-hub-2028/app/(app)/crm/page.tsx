'use client'

import { useEffect, useState } from 'react'
import {
  Search, Plus, MoreHorizontal, Mail, Phone, Globe,
  Star, StarOff, DollarSign, MessageSquare, Calendar,
  ArrowRight, X, Trash2,
} from 'lucide-react'

type PipelineStage = 'Lead' | 'Proposal' | 'Negotiation' | 'Active' | 'Completed'
const pipelineStages: PipelineStage[] = ['Lead', 'Proposal', 'Negotiation', 'Active', 'Completed']
const stageColors: Record<PipelineStage, string> = {
  Lead: '#6B7280', Proposal: '#16A34A', Negotiation: '#D97706',
  Active: '#22C55E', Completed: '#14B8A6',
}
const tagColors: Record<string, string> = {
  Design: '#16A34A', Development: '#22C55E', Marketing: '#D97706',
  Content: '#D97706', API: '#14B8A6', Data: '#14B8A6',
  Retainer: '#16A34A', Premium: '#D97706', Enterprise: '#22C55E',
  New: '#16A34A', Completed: '#6B7280',
}
const avatarBgs = ['#16A34A', '#22C55E', '#D97706', '#14B8A6', '#6B7280', '#3B82F6']
const emptyForm = { name: '', company: '', email: '', phone: '', website: '', value: '', notes: '' }

interface Client {
  id: number; name: string; company: string; email: string; phone: string
  website: string; stage: PipelineStage; value: number; avatar: string
  avatarBg: string; tags: string[]; lastContact: string; starred: boolean
  rating: number; notes: string
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
        <linearGradient id={`crmsg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#crmsg${id})`} />
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

export default function CRMPage() {
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/crm-clients').then(r => r.json())
      .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-menu]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = data.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    const matchStage = selectedStage === 'All' || c.stage === selectedStage
    return matchSearch && matchStage
  })

  const totalValue = data.reduce((a, c) => a + c.value, 0)
  const activeCount = data.filter(c => c.stage === 'Active').length
  const avgValue = data.length ? Math.round(totalValue / data.length) : 0
  const starredCount = data.filter(c => c.starred).length

  const toggleStar = async (id: number) => {
    const client = data.find(c => c.id === id)
    if (!client) return
    const starred = !client.starred
    setData(prev => prev.map(c => c.id === id ? { ...c, starred } : c))
    if (selectedClient?.id === id) setSelectedClient(prev => prev ? { ...prev, starred } : prev)
    await fetch(`/api/crm-clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred }),
    })
  }

  const changeStage = async (id: number, stage: PipelineStage) => {
    setData(prev => prev.map(c => c.id === id ? { ...c, stage } : c))
    if (selectedClient?.id === id) setSelectedClient(prev => prev ? { ...prev, stage } : prev)
    await fetch(`/api/crm-clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
  }

  const deleteClient = async (id: number) => {
    setOpenMenuId(null)
    setData(prev => prev.filter(c => c.id !== id))
    if (selectedClient?.id === id) setSelectedClient(null)
    await fetch(`/api/crm-clients/${id}`, { method: 'DELETE' })
  }

  const createClient = async () => {
    if (!form.name.trim() || !form.company.trim()) return
    const avatarBg = avatarBgs[data.length % avatarBgs.length]
    const res = await fetch('/api/crm-clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form, value: Number(form.value) || 0,
        stage: 'Lead', avatar: form.name.charAt(0).toUpperCase(),
        avatarBg, tags: ['New'], lastContact: 'just now', starred: false, rating: 0,
      }),
    })
    const created = await res.json()
    setData(prev => [created, ...prev])
    setForm(emptyForm); setShowModal(false)
  }

  const stats = [
    { label: 'Total Pipeline', value: `$${(totalValue / 1000).toFixed(1)}k`, trend: '+18% this quarter', up: true, spark: [40, 52, 48, 61, 58, Math.max(totalValue / 1000, 1)] },
    { label: 'Active Clients', value: String(activeCount), trend: '+12% vs last month', up: true, spark: [3, 5, 4, 6, 5, Math.max(activeCount, 1)] },
    { label: 'Avg Deal Size',  value: `$${(avgValue / 1000).toFixed(1)}k`, trend: '+7% vs last month', up: true, spark: [3, 4.2, 3.8, 5.1, 4.6, Math.max(avgValue / 1000, 1)] },
    { label: 'Starred',       value: String(starredCount), trend: 'High-priority accounts', up: true, spark: [1, 2, 2, 3, 3, Math.max(starredCount, 1)] },
  ]

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
            CRM
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>
            Manage client relationships &amp; pipeline
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 1px 3px rgba(22,163,74,0.3)' }}
        >
          <Plus size={14} /> Add Client
        </button>
      </div>

      {/* Stats bar — matching dashboard layout */}
      <div className="g-4col kpi-bar" style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 6, letterSpacing: '-0.02em' }}>{stat.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: stat.up ? '#16A34A' : '#EF4444', fontFamily: 'var(--font-body)' }}>{stat.trend}</span>
              <Sparkline values={stat.spark} color={stat.up ? '#16A34A' : '#EF4444'} id={i + 10} />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>PIPELINE STAGES</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{data.length} total clients</div>
        </div>
        <div className="g-5col" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {pipelineStages.map(stage => {
            const stageClients = data.filter(c => c.stage === stage)
            const stageValue = stageClients.reduce((a, c) => a + c.value, 0)
            const color = stageColors[stage]
            const pct = data.length ? Math.round((stageClients.length / data.length) * 100) : 0
            const isActive = selectedStage === stage
            return (
              <div
                key={stage}
                onClick={() => setSelectedStage(isActive ? 'All' : stage)}
                style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: isActive ? `${color}0D` : '#F9FAFB',
                  border: `1px solid ${isActive ? color + '40' : '#F3F4F6'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-body)' }}>{stage}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>{stageClients.length}</span>
                </div>
                <div style={{ height: 3, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                  ${stageValue.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', maxWidth: 360, flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            style={{ ...inputStyle, paddingLeft: 34, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
          {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
          {selectedStage !== 'All' && <span style={{ color: stageColors[selectedStage as PipelineStage], fontWeight: 600 }}> · {selectedStage}</span>}
        </span>
        {selectedStage !== 'All' && (
          <button
            onClick={() => setSelectedStage('All')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'white', border: '1px solid #F3F4F6', borderRadius: 8, fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading clients…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>

          {/* Client table */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    {['Client', 'Stage', 'Value', 'Tags', 'Last Contact', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', padding: '13px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontFamily: 'var(--font-body)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(client => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                      style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: selectedClient?.id === client.id ? 'rgba(22,163,74,0.04)' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (selectedClient?.id !== client.id) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                      onMouseLeave={e => { if (selectedClient?.id !== client.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${client.avatarBg}18`, border: `1.5px solid ${client.avatarBg}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: client.avatarBg, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                            {(client.avatar || client.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{client.name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, fontFamily: 'var(--font-body)' }}>{client.company}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: stageColors[client.stage], background: `${stageColors[client.stage]}12`, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-body)' }}>
                          {client.stage}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                          ${client.value.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {client.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: tagColors[tag] || '#16A34A', background: `${tagColors[tag] || '#16A34A'}12`, padding: '2px 7px', borderRadius: 10, fontFamily: 'var(--font-body)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{client.lastContact}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 3, position: 'relative' }} data-menu>
                          <button
                            onClick={e => { e.stopPropagation(); toggleStar(client.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: client.starred ? '#D97706' : '#D1D5DB' }}
                          >
                            {client.starred ? <Star size={14} fill="#D97706" stroke="none" /> : <StarOff size={14} />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === client.id ? null : client.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: '#9CA3AF' }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenuId === client.id && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{ position: 'absolute', right: 0, top: 28, background: 'white', border: '1px solid #F3F4F6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 130, overflow: 'hidden' }}
                            >
                              <button
                                onClick={() => deleteClient(client.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13, fontFamily: 'var(--font-body)' }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                        {search ? 'No clients match your search.' : 'No clients yet. Add your first one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedClient && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 24, position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${selectedClient.avatarBg}18`, border: `2px solid ${selectedClient.avatarBg}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: selectedClient.avatarBg, fontFamily: 'var(--font-display)' }}>
                    {(selectedClient.avatar || selectedClient.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{selectedClient.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: 'var(--font-body)' }}>{selectedClient.company}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 18 }}>
                {selectedClient.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 700, color: tagColors[tag] || '#16A34A', background: `${tagColors[tag] || '#16A34A'}12`, padding: '3px 9px', borderRadius: 10, fontFamily: 'var(--font-body)' }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 7, fontFamily: 'var(--font-body)' }}>Stage</div>
                <select
                  value={selectedClient.stage}
                  onChange={e => changeStage(selectedClient.id, e.target.value as PipelineStage)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10, fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                >
                  {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[{ icon: Mail, label: 'Email' }, { icon: Phone, label: 'Call' }, { icon: MessageSquare, label: 'Chat' }, { icon: Calendar, label: 'Meet' }].map(({ icon: Icon, label }) => (
                  <button key={label} style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: '#F9FAFB', border: '1px solid #F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
                {[
                  { icon: Mail,       label: 'Email',      value: selectedClient.email },
                  { icon: Phone,      label: 'Phone',      value: selectedClient.phone },
                  { icon: Globe,      label: 'Website',    value: selectedClient.website },
                  { icon: DollarSign, label: 'Deal Value', value: `$${selectedClient.value.toLocaleString()}` },
                ].map(({ icon: Icon, label, value }, i, arr) => (
                  <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <Icon size={13} color="#9CA3AF" />
                    <span style={{ fontSize: 11, color: '#9CA3AF', width: 60, flexShrink: 0, fontFamily: 'var(--font-body)' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {selectedClient.notes && (
                <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Notes</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{selectedClient.notes}</div>
                </div>
              )}

              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                View Full Profile <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, width: 420, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#111827', letterSpacing: '-0.01em' }}>New Client</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['name', 'company', 'email', 'phone', 'website'] as const).map(key => (
                <input key={key} placeholder={{ name: 'Full name', company: 'Company', email: 'Email', phone: 'Phone', website: 'Website' }[key]}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
              ))}
              <input type="number" placeholder="Deal value ($)" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={inputStyle} />
              <textarea placeholder="Notes (optional)" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })
              } style={{ ...inputStyle, resize: 'vertical' }} />
              <button onClick={createClient} style={{ width: '100%', padding: 11, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4 }}>
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
