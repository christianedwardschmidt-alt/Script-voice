'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Mic, Plus, ChevronDown } from 'lucide-react'
import WatchdogPanel from './WatchdogPanel'
import { useBrandPreview } from '@/lib/brandPreview'

const revenueData = [
  { month: 'Jan', income: 7200,  expenses: 2100 },
  { month: 'Feb', income: 9400,  expenses: 2800 },
  { month: 'Mar', income: 8100,  expenses: 1900 },
  { month: 'Apr', income: 11200, expenses: 3100 },
  { month: 'May', income: 10800, expenses: 2600 },
  { month: 'Jun', income: 13500, expenses: 3400 },
  { month: 'Jul', income: 12200, expenses: 2900 },
  { month: 'Aug', income: 14800, expenses: 3800 },
  { month: 'Sep', income: 13100, expenses: 3200 },
  { month: 'Oct', income: 16400, expenses: 4100 },
  { month: 'Nov', income: 15200, expenses: 3600 },
  { month: 'Dec', income: 17400, expenses: 4500 },
]

interface Client  { id: number; name: string; company: string; status: string; revenue: number }
interface Task    { id: number; checked: boolean; title?: string; priority?: string; project?: string }
interface Invoice { id: string; amount: number; status: string; client?: string; due?: string }
interface ActivityRow { id: number; message: string; createdAt: string; type?: string }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: number }) {
  const w = 72, h = 26
  const min = Math.min(...values)
  const max = Math.max(...values)
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
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={2.5} fill={color} />
    </svg>
  )
}

const TICK_COLOR = 'rgba(120,128,145,0.7)'

const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 6, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-body)' }}>
          <span>${Number(p.value).toLocaleString()}</span>
          <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 11 }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

const PIPELINE = [
  { label: 'NovaBuild — Mobile App',      amount: 2100, status: 'Draft',    due: 'Jan 20', color: '#64748b' },
  { label: 'Hencewood — API Integration', amount: 3200, status: 'Pending',  due: 'Jan 1',  color: '#D97706' },
  { label: 'DataSync — Discovery Call',   amount: 9800, status: 'Proposal', due: 'Jan 22', color: '#6366F1' },
]

const ACTIVITY_COLORS: Record<string, string> = {
  payment: 'var(--accent-brand)',
  client: '#3B82F6',
  invoice: '#D97706',
  overdue: '#EF4444',
}

function getDotColor(msg: string) {
  if (msg.toLowerCase().includes('paid') || msg.toLowerCase().includes('payment')) return 'var(--accent-brand)'
  if (msg.toLowerCase().includes('client') || msg.toLowerCase().includes('new')) return '#3B82F6'
  if (msg.toLowerCase().includes('invoice') || msg.toLowerCase().includes('sent')) return '#D97706'
  if (msg.toLowerCase().includes('overdue')) return '#EF4444'
  return 'var(--accent-brand)'
}

export default function DashboardPage() {
  const isVerunoPreview = useBrandPreview()
  const [clients, setClients]   = useState<Client[]>([])
  const [tasks, setTasks]       = useState<Task[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [userName, setUserName] = useState('there')

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const [showNewMenu, setShowNewMenu] = useState(false)
  const newMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setShowNewMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceInterim, setVoiceInterim] = useState('')
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceResult, setVoiceResult] = useState<{ text: string; actions: { name: string; summary: string }[] } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voiceRecRef = useRef<any>(null)
  const voiceTextRef = useRef('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/tasks').then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : []))
    fetch('/api/invoices').then(r => r.json()).then(d => setInvoices(Array.isArray(d) ? d : []))
    fetch('/api/activity?limit=6').then(r => r.json()).then(d => setActivity(Array.isArray(d) ? d : []))
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.displayName) setUserName(d.displayName.split(' ')[0] ?? 'there')
    }).catch(() => {})
  }, [])

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const checked = !task.checked
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked, status: checked ? 'completed' : 'todo' }),
    })
  }

  const activeClients   = clients.filter(c => c.status === 'active').length
  const tasksDone       = tasks.filter(t => t.checked).length
  const outstanding     = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const totalRevYTD     = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const thisMonthRev    = revenueData[revenueData.length - 1].income

  const stats = [
    { label: 'YTD Revenue',   value: `$${(totalRevYTD / 1000).toFixed(1)}k`, trend: '+18% vs last year', up: true, spark: revenueData.map(d => d.income) },
    { label: 'Dec Revenue',   value: `$${(thisMonthRev / 1000).toFixed(1)}k`, trend: '+14% vs Nov', up: true, spark: revenueData.slice(-6).map(d => d.income) },
    { label: 'Outstanding',   value: `$${(outstanding / 1000).toFixed(1)}k`, trend: '−8% vs last month', up: false, spark: [3100, 5200, 2800, 6400, 3200, outstanding > 0 ? outstanding : 1200] },
    { label: 'Active Clients', value: String(activeClients), trend: `+12% vs last month`, up: true, spark: [3, 5, 4, 5, 4, Math.max(activeClients, 1)] },
  ]

  const processVoiceCommand = async (text: string) => {
    setVoiceLoading(true)
    setVoiceResult(null)
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
      })
      const data = await res.json()
      setVoiceResult(data)
      if (data.actions?.length) fetch('/api/activity?limit=6').then(r => r.json()).then(d => setActivity(Array.isArray(d) ? d : []))
      const allNavActions = data.actions?.filter((a: { name: string; data?: Record<string, unknown> }) => a.name === 'navigate_to') ?? []
      const navAction = allNavActions[allNavActions.length - 1]
      if (navAction?.data?.url) {
        setTimeout(() => { window.location.href = navAction.data!.url as string }, 300)
      }
    } catch { setVoiceResult({ text: 'Something went wrong. Check your ANTHROPIC_API_KEY.', actions: [] }) }
    setVoiceLoading(false)
  }

  const startDashboardVoice = () => {
    if (voiceListening) { voiceRecRef.current?.stop(); setVoiceListening(false); setVoiceInterim(''); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Chrome, Edge, or Safari.'); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
    voiceRecRef.current = rec
    voiceTextRef.current = ''
    setVoiceListening(true); setVoiceInterim(''); setVoiceResult(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      const t = final || interim
      voiceTextRef.current = t
      setVoiceInterim(t)
    }

    rec.onend = () => {
      setVoiceListening(false); setVoiceInterim('')
      const text = voiceTextRef.current; voiceTextRef.current = ''
      if (text.trim()) processVoiceCommand(text.trim())
    }
    rec.onerror = () => { setVoiceListening(false); setVoiceInterim('') }
    rec.start()
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const standardHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700,
          color: '#111827', letterSpacing: '-0.02em', marginBottom: 6,
        }}>
          {greeting}, {userName}.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>
          Here&apos;s what&apos;s happening with your business.
        </p>
      </div>

      {/* Quick-create dropdown */}
      <div ref={newMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNewMenu(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 16px', background: isVerunoPreview ? 'var(--accent-gold)' : '#16A34A', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: isVerunoPreview ? '0 1px 4px rgba(201,162,75,0.35)' : '0 1px 4px rgba(22,163,74,0.35)',
          }}
        >
          <Plus size={14} /> New <ChevronDown size={12} style={{ opacity: 0.7 }} />
        </button>

        {showNewMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'white', border: '1px solid #F3F4F6',
            borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 50, minWidth: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Create</div>
            {[
              { icon: '🧾', label: 'Invoice',   href: '/invoicing', desc: 'Bill a client' },
              { icon: '📋', label: 'Proposal',  href: '/invoicing', desc: 'Send a proposal' },
              { icon: '💰', label: 'Quote',     href: '/invoicing', desc: 'Quick estimate' },
              { icon: '✅', label: 'Task',       href: '/tasks',    desc: 'Add to your list' },
              { icon: '👤', label: 'Client',    href: '/clients',  desc: 'Add contact' },
              { icon: '📅', label: 'Event',     href: '/calendar', desc: 'Schedule time' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setShowNewMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <span style={{ fontSize: 17, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{item.desc}</div>
                </div>
              </a>
            ))}
            <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
            <a
              href="/ai-assistant"
              onClick={() => setShowNewMenu(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', textDecoration: 'none', background: 'transparent', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0FDF4'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{ fontSize: 17, width: 28, textAlign: 'center', flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-brand)', fontFamily: 'var(--font-body)' }}>Ask AI to create</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Just describe it</div>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh' }}>

      <WatchdogPanel userName={userName} standardHeader={standardHeader} />

      {/* Stats row — unified bar */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: isVerunoPreview ? '1px solid rgba(14,20,32,0.08)' : 'none',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        marginBottom: 28,
      }}
        className="dash-kpi-grid"
      >
        {stats.map((stat, i) => (
          <div key={stat.label} style={{
            padding: isVerunoPreview ? '20px 24px' : '24px 28px',
            borderRight: i < 3 ? `1px solid ${isVerunoPreview ? 'rgba(14,20,32,0.10)' : '#F3F4F6'}` : 'none',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{stat.label}</div>
            <div style={{
              fontFamily: isVerunoPreview ? 'ui-monospace, "SF Mono", Menlo, monospace' : 'var(--font-display)',
              fontSize: 32, fontWeight: 700, color: '#111827', marginTop: 6,
              letterSpacing: isVerunoPreview ? '-0.01em' : '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>{stat.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: stat.up ? 'var(--accent-brand)' : '#EF4444', fontFamily: 'var(--font-body)' }}>{stat.trend}</span>
              <Sparkline values={stat.spark} color={stat.up ? 'var(--accent-brand)' : '#EF4444'} id={i} />
            </div>
          </div>
        ))}
      </div>

      {/* Tasks strip */}
      {tasks.filter(t => !t.checked).length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px', marginBottom: 16, borderTop: '2px solid var(--accent-brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>TASKS</span>
              <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 10, fontFamily: 'var(--font-body)' }}>{tasksDone} of {tasks.length} complete</span>
            </div>
            <a href="/tasks" style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>View all →</a>
          </div>
          <div style={{ height: 3, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: `${tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0}%`, height: '100%', background: 'var(--accent-brand)', borderRadius: 99, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tasks.filter(t => !t.checked).slice(0, 10).map(t => {
              const p = (t.priority ?? '').toLowerCase()
              const cls = p === 'high' || p === 'urgent' ? 'badge badge-high'
                        : p === 'medium' ? 'badge badge-medium'
                        : p === 'low' ? 'badge badge-low'
                        : 'badge badge-todo'
              return (
                <a key={t.id} href="/tasks" className={cls} style={{ cursor: 'pointer', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                  {t.title}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Bento grid: 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }} className="dash-bento-grid">

        {/* Revenue chart — col 1-2 */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 20px 12px', gridColumn: '1 / 3' }} className="dash-chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 4 }}>REVENUE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>Annual Overview · {new Date().getFullYear()}</div>
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 18, height: 2, background: isVerunoPreview ? '#1F2937' : 'var(--accent-brand)', display: 'inline-block', borderRadius: 2 }} />Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 18, height: 2, background: '#6366F1', display: 'inline-block', borderRadius: 2 }} />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={196}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isVerunoPreview ? '#1F2937' : 'var(--accent-brand)'} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={isVerunoPreview ? '#1F2937' : 'var(--accent-brand)'} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="income"   stroke={isVerunoPreview ? '#1F2937' : 'var(--accent-brand)'} strokeWidth={2}   fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="expenses" stroke="#6366F1" strokeWidth={1.5} fill="url(#expGrad)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* This Week — col 3 */}
        <div style={{
          background: isVerunoPreview
            ? 'linear-gradient(145deg, #0E1420 0%, #1A2436 50%, #0A0E16 100%)'
            : 'linear-gradient(145deg, #14532D 0%, #166534 50%, #15803D 100%)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: isVerunoPreview
            ? '0 4px 12px rgba(14,20,32,0.3), 0 12px 32px rgba(14,20,32,0.25)'
            : '0 4px 12px rgba(20,83,45,0.25), 0 12px 32px rgba(22,163,74,0.2)',
          padding: '20px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', marginBottom: 16 }}>THIS WEEK</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="week-stats-grid">
            {[
              { label: 'Invoiced',  val: '$4,200', pct: 87 },
              { label: 'Collected', val: '$3,100', pct: 64 },
              { label: 'Hours',     val: '38.5h',  pct: 96 },
              { label: 'Rate',      val: '$140/h',  pct: null },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: isVerunoPreview ? '#C9A24B' : '#fff', letterSpacing: '-0.5px' }}>{s.val}</div>
                {s.pct !== null && (
                  <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.18)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: isVerunoPreview ? '#C9A24B' : 'rgba(255,255,255,0.72)', borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top clients — col 1 */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>TOP CLIENTS</div>
            <a href="/clients" style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>View all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {clients.slice(0, 4).map((c, i) => {
              const colors = ['#16A34A', '#0EA5E9', '#6366F1', '#D97706']
              const col = colors[i % 4]
              const pct = clients.length ? Math.round((c.revenue / Math.max(...clients.map(x => x.revenue))) * 100) : 0
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: `${col}18`, border: `1px solid ${col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: col, flexShrink: 0, fontFamily: 'var(--font-body)' }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <div style={{ flex: 1, height: 3, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{c.status}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: col }}>${c.revenue.toLocaleString()}</div>
                </div>
              )
            })}
            {clients.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0', fontFamily: 'var(--font-body)' }}>No clients yet</div>}
          </div>
        </div>

        {/* Pipeline — col 2 */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>PIPELINE</div>
            <a href="/crm" style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Open CRM →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
            {PIPELINE.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < PIPELINE.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, fontFamily: 'var(--font-body)' }}>Due {p.due}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#111827' }}>${p.amount.toLocaleString()}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25`, fontFamily: 'var(--font-body)' }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Pipeline total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>${PIPELINE.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Recent Activity — col 3 */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 14 }}>RECENT ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.slice(0, 6).map((a, i) => {
              const dotColor = getDotColor(a.message)
              return (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid #F3F4F6' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#111827', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{a.message}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1, fontFamily: 'var(--font-body)' }}>{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
              )
            })}
            {activity.length === 0 && (
              <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0', fontFamily: 'var(--font-body)' }}>No recent activity</div>
            )}
          </div>
        </div>

      </div>

      {/* Voice FAB */}
      {!isMobile && (
        <button
          onClick={startDashboardVoice}
          title="Voice command"
          className="voice-fab"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 110,
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: voiceListening ? '#EF4444' : 'var(--accent-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: voiceListening
              ? '0 0 0 8px rgba(239,68,68,0.15), 0 4px 20px rgba(239,68,68,0.35)'
              : 'var(--shadow-green)',
            transition: 'all 0.2s ease',
          }}
        >
          <Mic size={22} color="#fff" />
        </button>
      )}

      {voiceListening && (
        <div style={{
          position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '8px 18px', borderRadius: 99, zIndex: 120, backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
        }}>
          Listening… {voiceInterim}
        </div>
      )}
      {voiceLoading && (
        <div style={{
          position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 13,
          padding: '8px 18px', borderRadius: 99, zIndex: 120, fontFamily: 'var(--font-body)',
        }}>
          Processing your request…
        </div>
      )}
      {voiceResult && (
        <div style={{
          position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)',
          background: 'white', border: '1px solid #E5E7EB', fontSize: 13, maxWidth: 400,
          padding: '12px 16px', borderRadius: 'var(--radius-md)', zIndex: 120, boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{ color: '#111827', lineHeight: 1.5 }}>{voiceResult.text}</div>
          <button onClick={() => setVoiceResult(null)} style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-body)' }}>Dismiss</button>
        </div>
      )}
    </div>
  )
}
