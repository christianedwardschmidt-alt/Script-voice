'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart3, Pencil, Check, X } from 'lucide-react'

interface PerformanceData {
  period: string
  agentName: string
  runCountAllTime: number
  timesRun: number
  previousTimesRun: number | null
  successRate: number
  timeSavedMinutes: number
  minutesPerRun: number
  revenueEligible: boolean
  revenueImpact: number
}

const PERIODS = [
  { value: 'week', label: 'This week', comparisonLabel: 'week' },
  { value: 'month', label: 'This month', comparisonLabel: 'month' },
  { value: '3months', label: 'Last 3 months', comparisonLabel: 'quarter' },
  { value: 'all', label: 'All time', comparisonLabel: '' },
]

function formatTimeSaved(minutes: number): string {
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)} hrs`
  return `${Math.round(minutes)} min`
}

function successRateStyle(rate: number): { color: string; label: string } {
  if (rate > 90) return { color: 'var(--accent-brand)', label: 'Excellent' }
  if (rate >= 70) return { color: '#CA8A04', label: 'Good' }
  return { color: '#EF4444', label: 'Needs attention' }
}

function useCountUp(target: number, delayMs: number, durationMs: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    let startTime: number | null = null
    const timer = setTimeout(() => {
      const tick = (t: number) => {
        if (startTime === null) startTime = t
        const elapsed = t - startTime
        const progress = Math.min(1, elapsed / durationMs)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(target * eased)
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delayMs)
    return () => { clearTimeout(timer); if (raf) cancelAnimationFrame(raf) }
  }, [target, delayMs, durationMs])
  return value
}

export default function PerformanceCard({ agentId }: { agentId: string }) {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealPhase, setRevealPhase] = useState<'pending' | 'animating' | 'done'>('pending')
  const [showInsight, setShowInsight] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const insightCache = useRef<Record<string, string | null>>({})
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateInput, setEstimateInput] = useState('15')
  const [savingEstimate, setSavingEstimate] = useState(false)

  const fetchInsight = useCallback((p: string, d: PerformanceData) => {
    if (insightCache.current[p] !== undefined) {
      setInsight(insightCache.current[p])
      setShowInsight(true)
      return
    }
    setInsightLoading(true)
    fetch(`/api/agents/${agentId}/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: p, timesRun: d.timesRun, previousTimesRun: d.previousTimesRun,
        successRate: d.successRate, timeSavedMinutes: d.timeSavedMinutes,
        revenueEligible: d.revenueEligible, revenueImpact: d.revenueImpact,
      }),
    })
      .then(r => r.ok ? r.json() : { insight: null })
      .then(res => { insightCache.current[p] = res.insight ?? null; setInsight(res.insight ?? null) })
      .catch(() => setInsight(null))
      .finally(() => { setInsightLoading(false); setShowInsight(true) })
  }, [agentId])

  const load = useCallback((p: string, isFirst: boolean) => {
    setLoading(true)
    setShowInsight(false)
    fetch(`/api/agents/${agentId}/performance?period=${p}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: PerformanceData | null) => {
        if (!d) return
        setData(d)
        setEstimateInput(String(d.minutesPerRun))
        if (d.runCountAllTime >= 3) {
          if (isFirst) {
            setRevealPhase('animating')
            setTimeout(() => setRevealPhase('done'), 3400)
            setTimeout(() => fetchInsight(p, d), 3400)
          } else {
            setRevealPhase('done')
            fetchInsight(p, d)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [agentId, fetchInsight])

  useEffect(() => { load('month', true) }, [load])

  function changePeriod(p: string) {
    setPeriod(p)
    load(p, false)
  }

  async function saveEstimate() {
    const minutes = Math.max(1, Number(estimateInput) || 15)
    setSavingEstimate(true)
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_time_estimate: minutes }),
      })
      setData(prev => prev ? { ...prev, minutesPerRun: minutes, timeSavedMinutes: prev.timesRun * minutes } : prev)
      setEditingEstimate(false)
    } finally {
      setSavingEstimate(false)
    }
  }

  const staggered = revealPhase === 'animating'
  const timesRunAnim = useCountUp(data?.timesRun ?? 0, staggered ? 0 : 0, staggered ? 800 : 400)
  const successRateAnim = useCountUp(data?.successRate ?? 0, staggered ? 800 : 0, staggered ? 800 : 400)
  const timeSavedAnim = useCountUp(data?.timeSavedMinutes ?? 0, staggered ? 1600 : 0, staggered ? 800 : 400)
  const revenueAnim = useCountUp(data?.revenueImpact ?? 0, staggered ? 2400 : 0, staggered ? 800 : 400)

  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 24, marginBottom: 24, width: '100%', boxSizing: 'border-box',
  }

  if (loading && !data) {
    return <div style={cardStyle}><div style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>Loading performance…</div></div>
  }

  if (!data) return null

  if (data.runCountAllTime < 3) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart3 size={24} color="var(--accent-brand)" />
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          Performance data coming soon
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', margin: '0 auto', maxWidth: 340, lineHeight: 1.5 }}>
          Run this agent a few times and we&apos;ll show you exactly what it&apos;s accomplishing for your business.
        </p>
      </div>
    )
  }

  const periodMeta = PERIODS.find(p => p.value === period) ?? PERIODS[1]
  const delta = data.previousTimesRun === null ? null : data.timesRun - data.previousTimesRun
  const srStyle = successRateStyle(data.successRate)

  return (
    <div style={cardStyle}>
      <style>{`
        @keyframes perf-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .perf-insight { animation: perf-fade-in 400ms ease; }
        .perf-period-select { appearance: none; -webkit-appearance: none; }
        .perf-edit-btn:hover { background: #F3F4F6 !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827' }}>Performance</span>
        <select
          className="perf-period-select"
          value={period}
          onChange={e => changePeriod(e.target.value)}
          style={{
            marginLeft: 'auto', padding: '6px 28px 6px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
            fontSize: 12.5, fontFamily: 'var(--font-body)', color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {/* Times Run */}
        <div style={{ borderRight: '1px solid #F3F4F6', paddingRight: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1 }}>TIMES RUN</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, fontWeight: 700, color: '#111827', margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(timesRunAnim)}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent-brand)' }}>
            {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta} vs last ${periodMeta.comparisonLabel}`}
          </div>
        </div>

        {/* Success Rate */}
        <div style={{ borderRight: '1px solid #F3F4F6', padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1 }}>SUCCESS RATE</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, fontWeight: 700, color: '#111827', margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(successRateAnim)}%
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: srStyle.color }}>{srStyle.label}</div>
        </div>

        {/* Time Saved */}
        <div style={{ borderRight: '1px solid #F3F4F6', padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1 }}>TIME SAVED</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, fontWeight: 700, color: '#111827', margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
            {formatTimeSaved(timeSavedAnim)}
          </div>
          {editingEstimate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min={1}
                value={estimateInput}
                onChange={e => setEstimateInput(e.target.value)}
                style={{ width: 48, padding: '3px 5px', borderRadius: 5, border: '1px solid #E5E7EB', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none' }}
              />
              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>min/run</span>
              <button onClick={saveEstimate} disabled={savingEstimate} className="perf-edit-btn" style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                <Check size={12} />
              </button>
              <button onClick={() => setEditingEstimate(false)} className="perf-edit-btn" style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                Est. based on {data.minutesPerRun} min per run · customize in settings
              </span>
              <button
                onClick={() => setEditingEstimate(true)}
                className="perf-edit-btn"
                title="Customize time estimate"
                style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0, marginTop: 1 }}
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Revenue Impact */}
        <div style={{
          paddingLeft: 20,
          paddingRight: data.revenueImpact > 0 ? 12 : 0,
          paddingTop: data.revenueImpact > 0 ? 8 : 0,
          paddingBottom: data.revenueImpact > 0 ? 8 : 0,
          marginTop: data.revenueImpact > 0 ? -8 : 0,
          marginBottom: data.revenueImpact > 0 ? -8 : 0,
          background: data.revenueImpact > 0 ? 'rgba(202,138,4,0.04)' : 'transparent',
          borderRadius: data.revenueImpact > 0 ? 10 : 0,
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#CA8A04', letterSpacing: 1 }}>REVENUE IMPACT</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, fontWeight: 700, color: '#CA8A04', margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
            {data.revenueEligible ? `$${Math.round(revenueAnim).toLocaleString()}` : '—'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: data.revenueEligible ? '#CA8A04' : '#9CA3AF' }}>
            {data.revenueEligible ? 'Est. recovered from payment reminders' : 'Not applicable'}
          </div>
        </div>
      </div>

      {revealPhase !== 'pending' && insightLoading && (
        <div style={{
          marginTop: 16, background: 'rgba(var(--accent-brand-rgb),0.03)', borderLeft: '3px solid var(--accent-brand)',
          borderRadius: '0 8px 8px 0', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#9CA3AF', fontStyle: 'italic',
        }}>
          Thinking about what this means for your business…
        </div>
      )}
      {showInsight && insight && (
        <div className="perf-insight" style={{
          marginTop: 16, background: 'rgba(var(--accent-brand-rgb),0.03)', borderLeft: '3px solid var(--accent-brand)',
          borderRadius: '0 8px 8px 0', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#111827', lineHeight: 1.5,
        }}>
          {insight}
        </div>
      )}
    </div>
  )
}
