'use client'

import { use, useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LineItem { id: string; name: string; qty: number; rate: number; total: number }
interface Milestone { id: string; name: string; date: string; description: string }
interface Deliverable { id: string; name: string; description: string; included: boolean }

interface PublicProposal {
  id: number
  title: string
  client_name: string
  client_email: string
  project_type: string
  status: string
  valid_until: string | null
  share_token: string
  owner_name: string
  introduction: string
  problem: string
  solution: string
  deliverables: string
  milestones: string
  line_items: string
  payment_terms: string
  about_me: string
  terms: string
  subtotal: number
  discount: number
  total: number
  sent_at: string | null
  accepted_at: string | null
  declined_at: string | null
  accepted_by: string | null
  view_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Section component ─────────────────────────────────────────────────────────

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {accent && <div style={{ width: 4, height: 28, borderRadius: 2, background: accent, flexShrink: 0 }} />}
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ── Acceptance modal ──────────────────────────────────────────────────────────

function AcceptModal({
  onClose,
  onAccept,
}: {
  onClose: () => void
  onAccept: (sig: string) => void
}) {
  const [sig, setSig] = useState('')
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Accept Proposal</h3>
        <p style={{ margin: '0 0 28px', color: '#6B7280', fontSize: 15, lineHeight: 1.5 }}>
          By typing your full name below you agree to the terms of this proposal and authorize the work described within.
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Full name (typed signature)
        </label>
        <input
          autoFocus
          placeholder="Your full name"
          value={sig}
          onChange={e => setSig(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
            borderRadius: 10, fontSize: 18, fontFamily: 'Georgia, serif',
            color: '#111827', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#16A34A' }}
          onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Date:</span>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{today}</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', border: '1.5px solid #E5E7EB',
              borderRadius: 10, background: 'white', color: '#374151',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            disabled={sig.trim().length < 2}
            onClick={() => onAccept(sig.trim())}
            style={{
              flex: 2, padding: '12px 0', border: 'none',
              borderRadius: 10,
              background: sig.trim().length >= 2 ? '#16A34A' : '#D1FAE5',
              color: sig.trim().length >= 2 ? 'white' : '#6EE7B7',
              fontSize: 15, fontWeight: 700, cursor: sig.trim().length >= 2 ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Accept &amp; Sign Proposal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [proposal, setProposal] = useState<PublicProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAccept, setShowAccept] = useState(false)
  const [actionState, setActionState] = useState<'idle' | 'accepting' | 'accepted' | 'declined' | 'changes'>('idle')
  const viewedRef = useRef(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    fetch(`/api/p/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setProposal(data)
        setLoading(false)
        if (['accepted', 'declined'].includes(data.status)) {
          setActionState(data.status as 'accepted' | 'declined')
        }
      })
      .catch(e => {
        setLoading(false)
        setNotFound(e === 404)
      })
  }, [token])

  // Track view on mount
  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true
      fetch(`/api/p/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      })
    }
    return () => {
      const timeSpent = Math.round((Date.now() - startRef.current) / 1000)
      if (timeSpent > 2) {
        navigator.sendBeacon
          ? navigator.sendBeacon(`/api/p/${token}`, JSON.stringify({ action: 'view', time_spent: timeSpent }))
          : void 0
      }
    }
  }, [token])

  async function handleAccept(sig: string) {
    setShowAccept(false)
    setActionState('accepting')
    await fetch(`/api/p/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', signature: sig }),
    })
    setActionState('accepted')
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this proposal?')) return
    await fetch(`/api/p/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline' }),
    })
    setActionState('declined')
  }

  // ── Loading / error states ──

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#6B7280', fontSize: 15 }}>Loading proposal…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound || !proposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Proposal not found</h2>
          <p style={{ color: '#6B7280', fontSize: 15 }}>This link may have expired or the proposal doesn't exist.</p>
        </div>
      </div>
    )
  }

  const deliverables = safeParse<Deliverable[]>(proposal.deliverables, []).filter(d => d.included)
  const milestones = safeParse<Milestone[]>(proposal.milestones, [])
  const lineItems = safeParse<LineItem[]>(proposal.line_items, [])
  const isFinalized = ['accepted', 'declined'].includes(actionState)

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>

      {/* Header strip */}
      <div style={{ background: '#111827', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Proposal from
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
            {proposal.owner_name || 'Your consultant'}
          </div>
        </div>
        {proposal.valid_until && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Valid until</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>{fmtDate(proposal.valid_until)}</div>
          </div>
        )}
      </div>

      {/* Hero title bar */}
      <div style={{ background: '#16A34A', padding: '40px 32px 44px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            {proposal.project_type}
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: 'white', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {proposal.title}
          </h1>
          {proposal.client_name && (
            <div style={{ marginTop: 14, fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              Prepared for {proposal.client_name}
            </div>
          )}
          {proposal.sent_at && (
            <div style={{ marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              {fmtDate(proposal.sent_at)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '52px 24px 120px' }}>

        {/* Accepted / Declined banner */}
        {actionState === 'accepted' && (
          <div style={{
            background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12,
            padding: '20px 24px', marginBottom: 40, display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#15803D', fontSize: 16, marginBottom: 4 }}>Proposal Accepted</div>
              <div style={{ color: '#166534', fontSize: 14 }}>
                {proposal.accepted_by ? `Signed by "${proposal.accepted_by}"` : 'You\'ve accepted this proposal.'} Thank you — expect to hear back shortly to get started.
              </div>
            </div>
          </div>
        )}

        {actionState === 'declined' && (
          <div style={{
            background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12,
            padding: '20px 24px', marginBottom: 40, display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 16, marginBottom: 4 }}>Proposal Declined</div>
              <div style={{ color: '#991B1B', fontSize: 14 }}>You've declined this proposal. If you change your mind, feel free to reach out directly.</div>
            </div>
          </div>
        )}

        {/* Introduction */}
        {proposal.introduction && (
          <Section title="Introduction" accent="#16A34A">
            <p style={{ margin: 0, color: '#374151', fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {proposal.introduction}
            </p>
          </Section>
        )}

        {/* The Problem */}
        {proposal.problem && (
          <Section title="The Challenge" accent="#6366F1">
            <p style={{ margin: 0, color: '#374151', fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {proposal.problem}
            </p>
          </Section>
        )}

        {/* The Solution */}
        {proposal.solution && (
          <Section title="Our Approach" accent="#D97706">
            <p style={{ margin: 0, color: '#374151', fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {proposal.solution}
            </p>
          </Section>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <Section title="What's Included" accent="#0EA5E9">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {deliverables.map(d => (
                <div key={d.id} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid #E5E7EB', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#F0FDF4', border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, marginBottom: 2 }}>{d.name}</div>
                    {d.description && <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.5 }}>{d.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Timeline */}
        {milestones.length > 0 && (
          <Section title="Project Timeline" accent="#8B5CF6">
            <div style={{ position: 'relative' }}>
              {milestones.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', gap: 20, marginBottom: i < milestones.length - 1 ? 0 : 0 }}>
                  {/* Left: line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B5CF6', border: '3px solid white', boxShadow: '0 0 0 2px #8B5CF6', flexShrink: 0, zIndex: 1 }} />
                    {i < milestones.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#E5E7EB', minHeight: 32, marginTop: 0 }} />
                    )}
                  </div>
                  {/* Right: content */}
                  <div style={{ paddingBottom: i < milestones.length - 1 ? 28 : 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{m.name}</span>
                      {m.date && (
                        <span style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600, background: '#F5F3FF', padding: '2px 8px', borderRadius: 20 }}>
                          {fmtDate(m.date)}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>{m.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Investment */}
        {lineItems.length > 0 && (
          <Section title="Investment" accent="#16A34A">
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: 13, width: 60 }}>Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', fontSize: 13, width: 100 }}>Rate</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', fontSize: 13, width: 110 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={li.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 ? '#FAFAFA' : 'white' }}>
                      <td style={{ padding: '13px 20px', color: '#111827', fontWeight: 500 }}>{li.name}</td>
                      <td style={{ padding: '13px 16px', color: '#6B7280', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{li.qty}</td>
                      <td style={{ padding: '13px 16px', color: '#6B7280', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(li.rate)}</td>
                      <td style={{ padding: '13px 20px', color: '#111827', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ borderTop: '1.5px solid #E5E7EB', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: 240 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#6B7280', fontSize: 14 }}>Subtotal</span>
                      <span style={{ color: '#374151', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{fmt(proposal.subtotal)}</span>
                    </div>
                    {proposal.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#6B7280', fontSize: 14 }}>Discount</span>
                        <span style={{ color: '#DC2626', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>-{fmt(proposal.discount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #E5E7EB', marginTop: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{fmt(proposal.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {proposal.payment_terms && (
                <div style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '12px 20px' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Payment terms: </span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{proposal.payment_terms}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* About */}
        {proposal.about_me && (
          <Section title="About Me" accent="#0EA5E9">
            <p style={{ margin: 0, color: '#374151', fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {proposal.about_me}
            </p>
          </Section>
        )}

        {/* Terms */}
        {proposal.terms && (
          <Section title="Terms &amp; Conditions">
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '20px 24px', border: '1px solid #E5E7EB' }}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {proposal.terms}
              </p>
            </div>
          </Section>
        )}

        {/* CTA block */}
        {!isFinalized && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
            padding: '36px 32px', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              Ready to move forward?
            </h3>
            <p style={{ margin: '0 0 28px', color: '#6B7280', fontSize: 15, lineHeight: 1.5 }}>
              Accept this proposal to lock in your project. You can also decline or request changes if something doesn't fit.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAccept(true)}
                style={{
                  padding: '14px 32px', border: 'none', borderRadius: 10,
                  background: '#16A34A', color: 'white', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = '0 6px 18px rgba(22,163,74,0.4)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 4px 12px rgba(22,163,74,0.3)'
                }}
              >
                Accept Proposal
              </button>

              <a
                href={`mailto:${proposal.client_email}?subject=Re: ${encodeURIComponent(proposal.title)}&body=Hi, I have some questions about your proposal...`}
                style={{
                  padding: '14px 24px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                  background: 'white', color: '#374151', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
                }}
              >
                Request Changes
              </a>

              <button
                onClick={handleDecline}
                style={{
                  padding: '14px 24px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                  background: 'white', color: '#9CA3AF', fontSize: 15, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #E5E7EB' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>
            Proposal powered by{' '}
            <span style={{ fontWeight: 600, color: '#6B7280' }}>GuildWire</span>
          </p>
        </div>
      </div>

      {/* Accept modal */}
      {showAccept && (
        <AcceptModal
          onClose={() => setShowAccept(false)}
          onAccept={handleAccept}
        />
      )}

      {/* Accepting spinner overlay */}
      {actionState === 'accepting' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '3px solid #E5E7EB', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#374151', fontWeight: 600, fontSize: 16 }}>Confirming acceptance…</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  )
}
