'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

export interface AgentSuggestion {
  id: number
  pattern_type: string
  suggested_agent_name: string
  suggested_agent_description: string
  suggested_agent_config: Record<string, unknown>
  pattern_basis: string
  impact_estimate: string
}

export function SuggestionEmptyState() {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', fontStyle: 'italic', margin: '0 0 24px' }}>
      The longer you use GuildWire the better I understand your business. Check back soon — I&apos;m learning.
    </p>
  )
}

export default function SuggestionCard({
  suggestion, onCreate, onDismiss, dismissing,
}: {
  suggestion: AgentSuggestion
  onCreate: (s: AgentSuggestion) => void
  onDismiss: (id: number) => void
  dismissing?: boolean
}) {
  return (
    <div data-testid={`suggestion-card-${suggestion.id}`} style={{
      background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 20,
      borderLeft: '4px solid #7C3AED', display: 'flex', flexDirection: 'column', gap: 10,
      opacity: dismissing ? 0.4 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={12} color="#7C3AED" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '1px' }}>
          SUGGESTED FOR YOU
        </span>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
          {suggestion.suggested_agent_name}
        </div>
        {suggestion.suggested_agent_description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', margin: '3px 0 0', lineHeight: 1.5 }}>
            {suggestion.suggested_agent_description}
          </p>
        )}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.55 }}>
        {suggestion.pattern_basis}
      </p>

      {suggestion.impact_estimate && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600 }}>
          {suggestion.impact_estimate}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onCreate(suggestion)} disabled={dismissing}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent-brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Create This Agent
        </button>
        <button onClick={() => onDismiss(suggestion.id)} disabled={dismissing}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Not for me
        </button>
      </div>
    </div>
  )
}
