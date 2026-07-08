'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowUpRight, Zap, Brain, Mic } from 'lucide-react'

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
interface ActivityRow { id: number; message: string; createdAt: string }

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

function TrendBadge({ pct, good = true }: { pct: number; good?: boolean }) {
  const up = pct >= 0
  const positive = good ? up : !up
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
      background: positive ? 'rgba(0,184,87,0.1)' : 'rgba(220,38,38,0.09)',
      color: positive ? '#008040' : '#c81e1e',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  )
}

const TICK_COLOR = 'rgba(120,128,145,0.7)'

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
          <span>${Number(p.value).toLocaleString()}</span>
          <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

const ACTION_ICONS: Record<string, string> = {
  create_task: '✓', draft_invoice: '🧾', add_client: '👤',
  schedule_event: '📅', search_jobs: '🔍', add_crm_contact: '📇',
  navigate_to: '🧭',
}

const QUICK_COMMANDS = [
  { label: '+ Add task', q: 'I need to add a task — what should I create?' },
  { label: '🧾 Draft invoice', q: 'I need to draft a new invoice for a client.' },
  { label: '🔍 Find jobs', q: 'Show me available job listings.' },
  { label: '📅 Schedule meeting', q: 'I need to schedule a client meeting.' },
]

const aiInsights = [
  { icon: '⚡', text: 'Stripe payment from Hencewood overdue by 3 days — send a nudge?', action: 'Draft email' },
  { icon: '📈', text: 'Revenue up 18% vs last quarter. Best month: October at $16.4k.', action: 'Breakdown' },
  { icon: '🎯', text: '2 tasks due today. Prioritize "API Integration" for TechTrophy first.', action: 'View tasks' },
]

const PIPELINE = [
  { label: 'NovaBuild — Mobile App',      amount: 2100, status: 'Draft',    due: 'Jan 20', color: '#64748b' },
  { label: 'Hencewood — API Integration', amount: 3200, status: 'Pending',  due: 'Jan 1',  color: '#d97706' },
  { label: 'DataSync — Discovery Call',   amount: 9800, status: 'Proposal', due: 'Jan 22', color: '#5b5fcf' },
]

export default function DashboardPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [tasks, setTasks]       = useState<Task[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])

  const [insightIdx, setInsightIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
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
  const tasksDonePct    = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0
  const outstanding     = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const totalRevYTD     = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const thisMonthRev    = revenueData[revenueData.length - 1].income
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue')
  const urgentTasks     = tasks.filter(t => !t.checked && ['high', 'High', 'urgent', 'Urgent'].includes(t.priority ?? ''))

  const kpi = [
    {
      label: 'YTD Revenue', value: `$${(totalRevYTD / 1000).toFixed(1)}k`, sub: 'vs $82.1k last year',
      accent: '#00b857', trend: 18,
      spark: revenueData.map(d => d.income),
    },
    {
      label: 'Dec Revenue', value: `$${(thisMonthRev / 1000).toFixed(1)}k`, sub: 'vs $15.2k last month',
      accent: '#0ea5e9', trend: 14,
      spark: revenueData.slice(-6).map(d => d.income),
    },
    {
      label: 'Outstanding', value: `$${(outstanding / 1000).toFixed(1)}k`, sub: 'across invoices',
      accent: '#d97706', trend: -8, good: false,
      spark: [3100, 5200, 2800, 6400, 3200, outstanding > 0 ? outstanding : 1200],
    },
    {
      label: 'Active Clients', value: String(activeClients), sub: `of ${clients.length} total`,
      accent: '#5b5fcf', trend: 12,
      spark: [3, 5, 4, 5, 4, Math.max(activeClients, 1)],
    },
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

  return (
    <div className="dash-wrap" style={{ padding: '28px 28px 52px', minHeight: '100vh' }}>

      {/* Page header */}
      <div className="dash-header animate-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, animationDelay: '0s' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>OVERVIEW</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text)', lineHeight: 1, textWrap: 'balance' } as any}>Dashboard</h1>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="dash-header-btns" style={{ display: 'flex', gap: 8 }}>
          <a href="/invoicing" className="btn-outline" style={{ fontSize: 12, textDecoration: 'none' }}>
            <ArrowUpRight size={13} /> View invoices
          </a>
          <a href="/tasks" className="btn-primary" style={{ fontSize: 12, textDecoration: 'none' }}>
            <Zap size={13} /> My tasks
          </a>
        </div>
      </div>

      {/* Today's Focus */}
      {(overdueInvoices.length > 0 || urgentTasks.length > 0) && (
        <div className="animate-in" style={{ marginBottom: 18, animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} className="ai-pulse" />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Today's Focus</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
              {overdueInvoices.length + urgentTasks.length} item{overdueInvoices.length + urgentTasks.length !== 1 ? 's' : ''} need attention
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {overdueInvoices.slice(0, 2).map(inv => (
              <div key={inv.id} className="card" style={{ padding: '13px 15px', borderLeft: '3px solid #dc2626', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#dc2626', textTransform: 'uppercase', marginBottom: 2 }}>Overdue · Invoice {inv.id}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums' }}>${inv.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{(inv as any).client || 'Unknown client'}</div>
                </div>
                <button className="btn-primary" style={{ fontSize: 11, padding: '6px 11px', flexShrink: 0 }}>Send reminder</button>
              </div>
            ))}
            {urgentTasks.slice(0, 2).map(t => (
              <div key={t.id} className="card" style={{ padding: '13px 15px', borderLeft: '3px solid #d97706', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#d97706', textTransform: 'uppercase', marginBottom: 2 }}>{(t.priority ?? 'High').charAt(0).toUpperCase() + (t.priority ?? 'high').slice(1)} priority</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || `Task #${t.id}`}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{t.project || 'No project'}</div>
                </div>
                <button className="btn-outline" style={{ fontSize: 11, padding: '6px 11px', flexShrink: 0 }}>Start</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {isMobile ? (
        <div className="card-ai animate-in" style={{ padding: '12px 14px', marginBottom: 18, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={12} style={{ color: 'var(--indigo)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--indigo)' }}>AI Insight</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {aiInsights.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setInsightIdx(i)}
                  style={{ width: i === insightIdx ? 16 : 6, height: 6, borderRadius: 99, border: 'none', cursor: 'pointer', background: i === insightIdx ? 'var(--indigo)' : 'rgba(91,95,207,0.25)', padding: 0, transition: 'all 0.2s' }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{aiInsights[insightIdx].icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1, lineHeight: 1.5 }}>{aiInsights[insightIdx].text}</span>
            <button style={{ border: 'none', background: 'rgba(91,95,207,0.09)', color: 'var(--indigo)', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
              {aiInsights[insightIdx].action}
            </button>
          </div>
        </div>
      ) : (
        <div className="card-ai animate-in" style={{ padding: '13px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <Brain size={13} style={{ color: 'var(--indigo)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--indigo)' }}>AI Insights</span>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(91,95,207,0.18)', flexShrink: 0 }} />
          {aiInsights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-2)', flex: 1, lineHeight: 1.4 }}>{ins.text}</span>
              <button style={{ border: 'none', background: 'rgba(91,95,207,0.09)', color: 'var(--indigo)', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                {ins.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tasks Widget */}
      <div className="animate-in" style={{ marginBottom: 18, animationDelay: '0.12s' }}>
        <div className="card" style={{ padding: '18px 20px', borderTop: '2px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>TASKS</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{tasksDone} of {tasks.length} complete</span>
            </div>
            <a href="/tasks" style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
              View all <ArrowUpRight size={10} />
            </a>
          </div>
          <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: `${tasksDonePct}%`, height: '100%', background: '#16a34a', borderRadius: 99, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tasks.filter(t => !t.checked).slice(0, 12).map(t => {
              const p = (t.priority ?? '').toLowerCase()
              const cls = p === 'high' || p === 'urgent' ? 'badge badge-high'
                        : p === 'medium' ? 'badge badge-medium'
                        : p === 'low' ? 'badge badge-low'
                        : 'badge badge-todo'
              return (
                <a key={t.id} href="/tasks" className={cls} style={{ padding: '5px 11px', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </a>
              )
            })}
            {tasks.filter(t => !t.checked).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 0' }}>All caught up 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* KPI row with sparklines */}
      <div className="dash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {kpi.map(({ label, value, sub, accent, trend, spark, good }, i) => (
          <div
            key={label}
            className="card card-lift animate-in"
            style={{ padding: '16px 16px 14px', borderTop: `2px solid ${accent}`, animationDelay: `${0.15 + i * 0.05}s` }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
              <TrendBadge pct={trend} good={good !== false} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 10 }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.3 }}>{sub}</div>
              <Sparkline values={spark} color={accent} id={i} />
            </div>
          </div>
        ))}
      </div>

      {/* Bento grid: 3 cols × 2 rows */}
      <div className="dash-bento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }}>

        {/* Revenue chart — col 1-2, row 1 */}
        <div className="card dash-chart-card animate-in" style={{ padding: '20px 20px 12px', gridColumn: '1 / 3', animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>REVENUE</div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text)' }}>Annual Overview · {new Date().getFullYear()}</div>
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 11, color: 'var(--text-2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 18, height: 2, background: '#00b857', display: 'inline-block', borderRadius: 2 }} />Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 18, height: 2, background: '#5b5fcf', display: 'inline-block', borderRadius: 2 }} />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={196}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b857" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#00b857" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5fcf" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#5b5fcf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="income"   stroke="#00b857" strokeWidth={2}   fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="expenses" stroke="#5b5fcf" strokeWidth={1.5} fill="url(#expGrad)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* This Week — col 3, row 1 */}
        <div className="card-glow animate-in" style={{ padding: '16px 18px', animationDelay: '0.45s', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
            <Zap size={11} style={{ color: 'rgba(255,255,255,0.75)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>THIS WEEK</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: 'Invoiced',  val: '$4,200', pct: 87 },
              { label: 'Collected', val: '$3,100', pct: 64 },
              { label: 'Hours',     val: '38.5h',  pct: 96 },
              { label: 'Rate',      val: '$140/h',  pct: null },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.8px', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                {s.pct !== null && (
                  <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.18)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: 'rgba(255,255,255,0.72)', borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top clients — col 1, row 2 */}
        <div className="card animate-in" style={{ padding: '18px 20px', animationDelay: '0.5s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>TOP CLIENTS</div>
            <a href="/clients" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
              View all <ArrowUpRight size={10} />
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {clients.slice(0, 4).map((c, i) => {
              const colors = ['#00b857', '#0ea5e9', '#5b5fcf', '#d97706']
              const col = colors[i % 4]
              const pct = clients.length ? Math.round((c.revenue / Math.max(...clients.map(x => x.revenue))) * 100) : 0
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${col}18`, border: `1px solid ${col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: col, fontVariantNumeric: 'tabular-nums' }}>${c.revenue.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline — col 2, row 2 */}
        <div className="card animate-in" style={{ padding: '18px 20px', animationDelay: '0.55s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>PIPELINE</div>
            <a href="/crm" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
              Open CRM <ArrowUpRight size={10} />
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
            {PIPELINE.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < PIPELINE.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>Due {p.due}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>${p.amount.toLocaleString()}</div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Pipeline total</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>${PIPELINE.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Activity — col 3, row 2 */}
        <div className="card animate-in" style={{ padding: '16px', animationDelay: '0.6s' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>RECENT ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.slice(0, 6).map((a, i) => (
              <div key={a.id} style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                <div className="dot-green" style={{ flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>No recent activity</div>
            )}
          </div>
        </div>

      </div>

      {/* Floating voice button — hides on mobile (mic is in bottom nav) */}
      {!isMobile && (
        <button
          onClick={startDashboardVoice}
          title="Voice command"
          className="voice-fab"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 110,
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: voiceListening ? '#ef4444' : '#16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: voiceListening
              ? '0 0 0 8px rgba(239,68,68,0.15), 0 4px 20px rgba(239,68,68,0.35)'
              : '0 4px 20px rgba(22,163,74,0.35)',
            transition: 'all 0.2s',
          }}
        >
          <Mic size={22} color="#fff" />
        </button>
      )}

      {/* Voice state feedback (mobile) */}
      {voiceListening && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '8px 18px', borderRadius: 99, zIndex: 120, backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
        }}>
          🎤 {voiceInterim || 'Listening…'}
        </div>
      )}
      {voiceLoading && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 13,
          padding: '8px 18px', borderRadius: 99, zIndex: 120,
        }}>
          ✨ Processing…
        </div>
      )}
    </div>
  )
}
