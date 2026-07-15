'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, Clock, Play, Users } from 'lucide-react'

interface AgentRun {
  id: number
  agent_id: number
  status: string
  trigger_event: string
  action_taken: string
  human_readable_summary: string | null
  technical_log: Record<string, unknown> | null
  ran_at: string
}

const PAGE_SIZE = 20
const POLL_MS = 5000

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  if (sameDay) return `Today at ${time}`
  const hrs = Math.floor(mins / 60)
  if (hrs < 6) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  if (isYesterday) return `Yesterday at ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

function statusColor(status: string): string {
  if (status === 'success') return 'var(--accent-brand)'
  if (status === 'failed') return '#EF4444'
  return '#CA8A04'
}

function mergeRuns(existing: AgentRun[], fresh: AgentRun[]): { merged: AgentRun[]; changedIds: Set<number> } {
  const freshMap = new Map(fresh.map(r => [r.id, r]))
  const changedIds = new Set<number>()
  const carried = existing.map(r => {
    const f = freshMap.get(r.id)
    if (!f) return r
    if (f.status !== r.status || f.human_readable_summary !== r.human_readable_summary || f.action_taken !== r.action_taken) {
      changedIds.add(r.id)
    }
    return f
  })
  const existingIds = new Set(existing.map(r => r.id))
  const brandNew = fresh.filter(r => !existingIds.has(r.id))
  for (const r of brandNew) changedIds.add(r.id)
  const merged = [...brandNew, ...carried].sort((a, b) => new Date(b.ran_at).getTime() - new Date(a.ran_at).getTime())
  return { merged, changedIds }
}

export default function ActivityFeed({ agentId, agentActive, refreshSignal }: { agentId: string; agentActive: boolean; refreshSignal: number }) {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<Set<number>>(new Set())
  const runsRef = useRef<AgentRun[]>([])
  useEffect(() => { runsRef.current = runs }, [runs])

  const poll = useCallback(async () => {
    const current = runsRef.current
    const limit = Math.max(PAGE_SIZE, current.length)
    const res = await fetch(`/api/agents/${agentId}/activity?offset=0&limit=${limit}`)
    if (!res.ok) return
    const data = await res.json()
    const { merged, changedIds } = mergeRuns(current, data.runs)
    if (changedIds.size > 0) {
      setFlash(changedIds)
      setTimeout(() => setFlash(new Set()), 320)
    }
    setRuns(merged)
    setHasMore(data.hasMore)
  }, [agentId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/agents/${agentId}/activity?offset=0&limit=${PAGE_SIZE}`)
      if (!res.ok || cancelled) { setLoading(false); return }
      const data = await res.json()
      if (cancelled) return
      setRuns(data.runs)
      setHasMore(data.hasMore)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [agentId])

  useEffect(() => {
    const interval = setInterval(poll, POLL_MS)
    return () => clearInterval(interval)
  }, [poll])

  useEffect(() => {
    if (refreshSignal > 0) poll()
  }, [refreshSignal, poll])

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/activity?offset=${runs.length}&limit=${PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        setRuns(r => [...r, ...data.runs])
        setHasMore(data.hasMore)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runningEntry = runs.find(r => r.status === 'running')
  const displayRuns = runs.filter(r => r.status !== 'running')

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 24 }}>
      <style>{`
        @keyframes agentPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.82); } }
        @keyframes textShimmerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes entryFadeIn { from { opacity: 0.25; } to { opacity: 1; } }
        @keyframes clockAnticipate { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        .activity-entry-fresh { animation: entryFadeIn 300ms ease; }
        .activity-chevron-btn:hover { background: #F3F4F6 !important; }
        .load-more-btn:hover { text-decoration: underline; }
        @media (prefers-reduced-motion: reduce) {
          .activity-entry-fresh, [data-anim] { animation: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827' }}>Activity</span>
        {agentActive && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span data-anim style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-brand)', animation: 'agentPulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600 }}>Live</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading activity…</div>
      ) : runs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div>
            {runningEntry && <RunningEntry isLast={displayRuns.length === 0} />}
            {displayRuns.map((run, i) => (
              <Entry
                key={run.id}
                run={run}
                isLast={i === displayRuns.length - 1 && !hasMore}
                expanded={expanded.has(run.id)}
                onToggle={() => toggleExpand(run.id)}
                flash={flash.has(run.id)}
              />
            ))}
          </div>
          {hasMore && (
            <button
              className="load-more-btn"
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                display: 'block', margin: '16px auto 0', padding: '8px 16px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--accent-brand)', fontWeight: 500,
              }}
            >
              {loadingMore ? 'Loading…' : 'Load more activity'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function RunningEntry({ isLast }: { isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#CA8A04', marginTop: 4, flexShrink: 0 }} />
        {!isLast && <span style={{ width: 2, flex: 1, background: '#F3F4F6', marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
        <div data-anim style={{
          fontFamily: 'var(--font-body)', fontSize: 14, fontStyle: 'italic', color: '#CA8A04',
          animation: 'textShimmerPulse 1.4s ease-in-out infinite',
        }}>
          Running now…
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 3 }}>In progress</div>
      </div>
    </div>
  )
}

function Entry({ run, isLast, expanded, onToggle, flash }: { run: AgentRun; isLast: boolean; expanded: boolean; onToggle: () => void; flash: boolean }) {
  const color = statusColor(run.status)
  const primaryText = run.human_readable_summary || run.action_taken || 'No summary available.'
  const involvedCollaborator = !!(run.technical_log && (run.technical_log as Record<string, unknown>).involved_collaborator)
  const [detailHeight, setDetailHeight] = useState(0)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && detailRef.current) setDetailHeight(detailRef.current.scrollHeight)
    else setDetailHeight(0)
  }, [expanded, run.technical_log, run.status, run.action_taken])

  return (
    <div style={{ display: 'flex', gap: 12 }} className={flash ? 'activity-entry-fresh' : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
        {!isLast && <span style={{ width: 2, flex: 1, background: '#F3F4F6', marginTop: 4 }} />}
      </div>

      <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              {involvedCollaborator && (
                <span
                  title="A collaborator was notified"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: '50%', background: 'rgba(124,58,237,0.12)',
                    flexShrink: 0, marginTop: 1,
                  }}
                >
                  <Users size={11} color="#7C3AED" />
                </span>
              )}
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#111827', lineHeight: 1.5 }}>
                {primaryText}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 3 }}>
              {relativeTime(run.ran_at)}
            </div>
          </div>
          <button
            className="activity-chevron-btn"
            onClick={onToggle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#9CA3AF', flexShrink: 0, transition: 'background 0.12s',
            }}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>

        <div style={{ overflow: 'hidden', maxHeight: detailHeight, transition: 'max-height 200ms ease' }}>
          <div ref={detailRef} style={{
            background: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 10,
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280',
          }}>
            <div style={{ marginBottom: 6 }}><strong style={{ color: '#374151' }}>Trigger:</strong> {run.trigger_event}</div>
            <div style={{ marginBottom: 6 }}><strong style={{ color: '#374151' }}>Status:</strong> {run.status}</div>
            <div style={{ marginBottom: run.technical_log ? 6 : 0 }}><strong style={{ color: '#374151' }}>Raw action:</strong> {run.action_taken}</div>
            {run.technical_log && (
              <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(run.technical_log, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 16px' }}>
        <div data-anim style={{
          width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'clockAnticipate 2.4s ease-in-out infinite',
        }}>
          <Clock size={26} color="var(--accent-brand)" strokeWidth={1.75} />
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
          background: 'var(--accent-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
        }}>
          <Play size={10} color="#fff" fill="#fff" />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, color: '#374151', fontWeight: 700, marginBottom: 6 }}>
        No activity yet
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
        When this agent runs you&apos;ll see exactly what it did right here. In plain English.
      </div>
    </div>
  )
}
