'use client'

import React, { useEffect, useState } from 'react'
import { Star, Check } from 'lucide-react'

export default function RatingPrompt({ marketplaceAgentId }: { marketplaceAgentId: number }) {
  const [loading, setLoading] = useState(true)
  const [existingRating, setExistingRating] = useState<number | null>(null)
  const [hoverStar, setHoverStar] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/marketplace/${marketplaceAgentId}/rate`)
      .then(r => r.ok ? r.json() : { rating: null })
      .then(data => setExistingRating(data.rating ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [marketplaceAgentId])

  async function rate(value: number) {
    if (submitting || existingRating !== null) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/marketplace/${marketplaceAgentId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      })
      if (res.ok) setExistingRating(value)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      {existingRating !== null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>
          <Check size={15} color="#16A34A" />
          Thanks for rating this agent {existingRating} star{existingRating === 1 ? '' : 's'}.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>
            How useful has this agent been for your business?
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onClick={() => rate(i)}
                onMouseEnter={() => setHoverStar(i)}
                onMouseLeave={() => setHoverStar(0)}
                disabled={submitting}
                style={{ background: 'none', border: 'none', cursor: submitting ? 'default' : 'pointer', padding: 2, lineHeight: 0 }}
                aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
              >
                <Star size={19} color="#CA8A04" fill={i <= hoverStar ? '#CA8A04' : 'none'} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
