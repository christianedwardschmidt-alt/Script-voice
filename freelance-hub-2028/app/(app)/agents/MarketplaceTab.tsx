'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Star, Sparkles, Check, Users2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketplaceAgentConfig {
  icon: string
  trigger_type: string
  conditions: unknown[]
  actions: unknown[]
}

interface MarketplaceAgent {
  id: number
  name: string
  slug: string
  description: string
  category: string
  configuration: MarketplaceAgentConfig
  submitted_by_profession: string
  clone_count: number
  average_rating: number
  rating_count: number
  featured: boolean
  created_at: string
}

const CATEGORIES = ['All', 'Invoicing', 'Client Relations', 'Tax', 'Proposals', 'Productivity', 'Community'] as const

const CATEGORY_COLORS: Record<string, string> = {
  Invoicing: '#16A34A',
  'Client Relations': '#EC4899',
  Tax: '#CA8A04',
  Proposals: '#6366F1',
  Productivity: '#8B5CF6',
  Community: '#14B8A6',
}

function hasConditionalLogic(config: MarketplaceAgentConfig): boolean {
  return Array.isArray(config?.actions) && config.actions.some(a => !!a && typeof a === 'object' && (a as { type?: string }).type === 'rule')
}

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={12} color="#CA8A04" fill={i <= rounded ? '#CA8A04' : 'none'} strokeWidth={1.5} />
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#9CA3AF' }}>
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
    </div>
  )
}

export default function MarketplaceTab({
  onClone,
  onGoToMyAgents,
}: {
  onClone: (config: MarketplaceAgentConfig, name: string, marketplaceAgentId: number) => void
  onGoToMyAgents: () => void
}) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All')
  const [visible, setVisible] = useState(true)
  const [pulsingId, setPulsingId] = useState<number | null>(null)
  const [cloneToast, setCloneToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/marketplace')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAgents(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 150ms fade when switching category
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [category])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter(a => {
      const matchesCategory = category === 'All' || a.category === category
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [agents, search, category])

  async function handleClone(agent: MarketplaceAgent) {
    setPulsingId(agent.id)
    setTimeout(() => setPulsingId(null), 300)

    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, clone_count: a.clone_count + 1 } : a))
    fetch(`/api/marketplace/${agent.slug}/clone`, { method: 'POST' }).catch(() => {})

    setCloneToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setCloneToast(false), 3000)

    // let the pulse + toast register before handing off to the builder
    setTimeout(() => onClone(agent.configuration, agent.name, agent.id), 550)
  }

  return (
    <div>
      <style>{`
        @keyframes mkt-pulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); } 100% { box-shadow: 0 0 0 14px rgba(22,163,74,0); } }
        @keyframes mkt-toast-in { from { opacity: 0; transform: translateY(8px) translateX(0); } to { opacity: 1; transform: translateY(0) translateX(0); } }
        @keyframes mkt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .mkt-card { transition: box-shadow 0.15s, transform 0.15s; }
        .mkt-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .mkt-card.pulsing { animation: mkt-pulse 0.3s ease-out; }
        .mkt-clone-btn:hover { background: #15803D !important; }
        .mkt-cat-tab { transition: all 0.15s; }
        .mkt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .mkt-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .mkt-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search marketplace agents..."
          style={{
            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid #E5E7EB',
            fontSize: 13, fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => {
          const active = category === c
          const color = c === 'All' ? '#111827' : CATEGORY_COLORS[c]
          return (
            <button
              key={c}
              className="mkt-cat-tab"
              onClick={() => setCategory(c)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', border: active ? `1.5px solid ${color}` : '1.5px solid #E5E7EB',
                background: active ? `${color}14` : '#fff', color: active ? color : '#6B7280',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* Grid / states */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>
          Loading marketplace…
        </div>
      ) : filtered.length === 0 ? (
        <MarketplaceEmptyState onGoToMyAgents={onGoToMyAgents} />
      ) : (
        <div className="mkt-grid" style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease' }}>
          {filtered.map(agent => {
            const color = CATEGORY_COLORS[agent.category] ?? '#16A34A'
            const isSmart = hasConditionalLogic(agent.configuration)
            return (
              <div
                key={agent.id}
                className={`mkt-card${pulsingId === agent.id ? ' pulsing' : ''}`}
                style={{
                  background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 20,
                  border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                }}
              >
                {agent.featured && (
                  <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={15} color="#CA8A04" fill="#CA8A04" />
                  </div>
                )}

                <div style={{ paddingRight: agent.featured ? 20 : 0 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {agent.name}
                  </div>
                  <span style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                    background: `${color}14`, color, fontFamily: 'var(--font-body)',
                  }}>
                    {agent.category}
                  </span>
                  {isSmart && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
                      padding: '2px 9px 2px 7px', borderRadius: 20, marginLeft: 6,
                      background: 'rgba(202,138,4,0.12)', color: '#92650A', fontFamily: 'var(--font-body)',
                    }}>
                      <Sparkles size={10} color="#CA8A04" fill="#CA8A04" />
                      Smart Agent
                    </span>
                  )}
                </div>

                {agent.featured && (
                  <div style={{ fontSize: 11, color: '#CA8A04', fontFamily: 'var(--font-body)', fontWeight: 600, marginTop: -6 }}>
                    Most Popular This Week
                  </div>
                )}

                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                  {agent.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                  <Users2 size={12} />
                  Used by {agent.clone_count} member{agent.clone_count === 1 ? '' : 's'}
                </div>

                <StarRow rating={agent.average_rating} />

                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                  Submitted by {agent.submitted_by_profession || 'Independent Professional'}
                </div>

                <button
                  className="mkt-clone-btn"
                  onClick={() => handleClone(agent)}
                  style={{
                    width: '100%', marginTop: 4, padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'background 0.15s',
                  }}
                >
                  Clone This Agent
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Clone toast — bottom right */}
      {cloneToast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000, animation: 'mkt-toast-in 0.2s ease',
          background: '#111827', color: '#fff', padding: '11px 18px', borderRadius: 10, fontSize: 13,
          fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <Check size={14} color="#4ADE80" strokeWidth={2.5} />
          Agent cloned — find it in My Agents
        </div>
      )}
    </div>
  )
}

function MarketplaceEmptyState({ onGoToMyAgents }: { onGoToMyAgents: () => void }) {
  return (
    <div style={{ padding: '64px 20px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        animation: 'mkt-float 2.6s ease-in-out infinite',
      }}>
        <Sparkles size={28} color="#16A34A" strokeWidth={1.75} />
      </div>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        The marketplace grows as the guild grows.
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
        Be one of the first to share an agent with the community.
      </p>
      <button
        onClick={onGoToMyAgents}
        style={{
          padding: '10px 20px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        Share your first agent
      </button>
    </div>
  )
}
