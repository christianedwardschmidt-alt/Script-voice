'use client'

import { useEffect, useState } from 'react'

export default function WorkspaceSelector() {
  const [name, setName] = useState('My Studio')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d?.workspaceName) setName(d.workspaceName)
    }).catch(() => {})
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 10px',
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 8, cursor: 'pointer',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        background: 'linear-gradient(135deg, #007a3a, #00b857)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800, color: '#fff',
      }}>{name.charAt(0).toUpperCase()}</div>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{name}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}><path d="m6 9 6 6 6-6"/></svg>
    </div>
  )
}
