'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(90deg, #92400e, #CA8A04, #92400e)',
      backgroundSize: '200% 100%',
      animation: 'shimmer-gold 4s ease infinite',
      fontSize: 13, fontWeight: 500, color: 'white', letterSpacing: '0.01em',
      gap: 8,
      fontFamily: 'var(--font-body)',
    }}>
      <span>✦ Founding member spots are limited — 30 days free · 20% off for life ·</span>
      <Link href="/signup" style={{ color: 'white', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
        Claim yours →
      </Link>
      <button
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
        style={{
          position: 'absolute', right: 16,
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          fontSize: 18, lineHeight: 1, padding: '0 4px',
          fontFamily: 'inherit', transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
      >
        ×
      </button>
    </div>
  )
}
