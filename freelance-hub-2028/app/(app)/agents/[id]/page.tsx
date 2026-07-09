'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Settings2, Activity, Timer,
  ToggleLeft, ToggleRight, CheckCircle, XCircle,
  RefreshCw, Zap, TrendingUp,
} from 'lucide-react'

type AgentRun = {
  id: number
  agent_id: number
  user_id: number
  status: string
  trigger_event: string
  action_taken: string
  ran_at: string
}

type Agent = {
  id: number
  name: string
  icon: string
  description: string
  status: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  conditions: unknown[]
  actions: unknown[]
  run_count: number
  last_run: string | null
  created_at: string
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${id}`)
      if (!res.ok) { router.push('/agents'); return }
      const data = await res.json()
      setAgent(data.agent)
      setRuns(data.runs || [])
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const toggleStatus = async () => {
    if (!agent || toggling) return
    setToggling(true)
    const next = agent.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setAgent(a => a ? { ...a, status: next } : a)
        showToast(next === 'active' ? 'Agent activated' : 'Agent paused')
      }
    } finally {
      setToggling(false)
    }
  }

  const runNow = async () => {
    if (!agent || running) return
    setRunning(true)
    try {
      const res = await fetch(`/api/agents/${id}/run`, { method: 'POST' })
      if (res.ok) {
        showToast('Agent ran successfully')
        await load()
      }
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-3)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!agent) return null

  const isActive = agent.status === 'active'
  const successCount = runs.filter(r => r.status === 'success').length
  const successRate = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 100

  const statCards = [
    { label: 'Total Runs', value: agent.run_count, icon: Activity, color: '#6366f1' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: '#16a34a' },
    { label: 'Last Run', value: relativeTime(agent.last_run), icon: Timer, color: '#f59e0b' },
  ]

  return (
    <div className="page-pad" style={{ maxWidth: 860, margin: '0 auto', paddingTop: 24, paddingBottom: 80 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .run-row:hover { background: var(--hover) !important; }
        .action-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', borderRadius: 10, padding: '10px 18px',
          fontSize: 14, fontWeight: 500, zIndex: 999, animation: 'fadeIn 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}

      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => router.push('/agents')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            border: '1px solid var(--border)', borderRadius: 8, background: 'transparent',
            color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={14} />
          Agents
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 32 }}>{agent.icon}</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                {agent.name}
              </h1>
              {agent.description && (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '2px 0 0' }}>{agent.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status toggle */}
        <button
          onClick={toggleStatus}
          disabled={toggling}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: isActive ? 'rgba(22,163,74,0.12)' : 'var(--bg-2)',
            color: isActive ? '#16a34a' : 'var(--text-3)',
            transition: 'all 0.15s',
          }}
        >
          {isActive
            ? <><ToggleRight size={18} />{toggling ? 'Pausing…' : 'Active'}</>
            : <><ToggleLeft size={18} />{toggling ? 'Activating…' : 'Paused'}</>
          }
        </button>

        {/* Run now */}
        <button
          onClick={runNow}
          disabled={running}
          className="action-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #16a34a 0%, #10b981 100%)',
            color: '#fff', transition: 'opacity 0.15s',
          }}
        >
          {running
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />Running…</>
            : <><Play size={15} />Run Now</>
          }
        </button>

        {/* Edit */}
        <button
          onClick={() => router.push('/agents?edit=' + id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 9, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'transparent', color: 'var(--text-2)',
          }}
        >
          <Settings2 size={15} />
          Edit Agent
        </button>

        {/* Trigger label */}
        {agent.trigger_type && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 20, background: 'var(--bg-2)',
            fontSize: 12, color: 'var(--text-3)', fontWeight: 500,
          }}>
            <Zap size={13} />
            {agent.trigger_type}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-syne)', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Run history */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Activity size={16} color="var(--text-3)" />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>Run History</span>
          {runs.length > 0 && (
            <span style={{
              marginLeft: 'auto', fontSize: 12, background: 'var(--bg-2)',
              padding: '2px 8px', borderRadius: 20, color: 'var(--text-3)',
            }}>{runs.length} runs</span>
          )}
        </div>

        {runs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <Activity size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No runs yet — click "Run Now" to test this agent</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-2)' }}>
                  {['Date', 'Trigger', 'Status', 'Action Taken'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontWeight: 600,
                      color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => (
                  <tr
                    key={run.id}
                    className="run-row"
                    style={{
                      borderBottom: i < runs.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {formatDate(run.ran_at)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>
                      {run.trigger_event}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: run.status === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
                        color: run.status === 'success' ? '#16a34a' : '#ef4444',
                      }}>
                        {run.status === 'success'
                          ? <><CheckCircle size={11} />Success</>
                          : <><XCircle size={11} />Failed</>
                        }
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', maxWidth: 280 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {run.action_taken}
                      </span>
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
}
