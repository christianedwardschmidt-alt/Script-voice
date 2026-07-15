'use client'

import React, { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

const CATEGORIES = ['Invoicing', 'Client Relations', 'Tax', 'Proposals', 'Productivity', 'Community']
const DESCRIPTION_LIMIT = 80

export default function SubmitModal({
  agentId,
  agentName,
  onClose,
}: {
  agentId: number
  agentName: string
  onClose: () => void
}) {
  const [name, setName] = useState(agentName)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = name.trim() && description.trim() && confirmed && !submitting

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/marketplace/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, name: name.trim(), category, description: description.trim(), confirmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <style>{`
        @keyframes submit-card-float { 0% { opacity: 0; transform: translateY(28px) scale(0.94); } 60% { opacity: 1; transform: translateY(-4px) scale(1.01); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes submit-modal-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)', position: 'relative', overflow: 'hidden',
          animation: 'submit-modal-in 0.2s ease',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.06)', border: 'none',
            borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(15,17,23,0.4)', zIndex: 1,
          }}
        >
          <X size={14} />
        </button>

        {submitted ? (
          <div style={{ padding: '48px 32px 40px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'rgba(var(--accent-brand-rgb),0.08)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'submit-card-float 0.6s ease',
            }}>
              <Sparkles size={28} color="var(--accent-brand)" />
            </div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
              Your agent is on its way to the guild.
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              We&apos;ll review it and notify you when it goes live. Thank you for contributing.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--accent-brand)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '28px 28px 24px' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              Share to Marketplace
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
              Let other independent professionals clone what&apos;s working for you.
            </p>

            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Template name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13,
                fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box', marginBottom: 16,
              }}
            />

            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13,
                fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box', marginBottom: 16,
                background: '#fff',
              }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              <span>One line description</span>
              <span style={{ color: description.length > DESCRIPTION_LIMIT ? '#EF4444' : '#9CA3AF', fontWeight: 500 }}>
                {description.length}/{DESCRIPTION_LIMIT}
              </span>
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))}
              placeholder="What it does and who it helps"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13,
                fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box', marginBottom: 18,
              }}
            />

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 20, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                I confirm this agent has been anonymized and contains no personal client data.
              </span>
            </label>

            {error && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#EF4444', marginBottom: 14 }}>{error}</div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                background: canSubmit ? 'var(--accent-brand)' : '#D1D5DB', color: '#fff', fontSize: 13.5, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
