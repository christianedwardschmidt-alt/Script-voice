'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  useEffect(() => { console.error('[app error]', error) }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 16, padding: 24,
    }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Something went wrong</h2>
      <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', margin: 0, textAlign: 'center', maxWidth: 320 }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding: '9px 18px', background: 'linear-gradient(135deg,#007a3a,#00b857)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Try again</button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '9px 18px', background: 'rgba(0,0,0,0.06)',
            color: 'var(--text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Go to dashboard</button>
      </div>
    </div>
  )
}
