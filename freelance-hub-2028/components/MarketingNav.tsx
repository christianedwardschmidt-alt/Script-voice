'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function MarketingNav() {
  const [hovered, setHovered] = useState(false)

  return (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        {/* Logo */}
        <Link href="/" className="mkt-logo" style={{ marginLeft: 120 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
            <span style={{ color: 'white' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="mkt-nav-links">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Community', href: '#community' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Blog', href: '#blog' },
          ].map(l => (
            <a key={l.label} href={l.href} className="mkt-nav-link">{l.label}</a>
          ))}
        </div>

        {/* Right CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" className="mkt-nav-signin">Sign in</Link>
          <Link
            href="/signup"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 44,
              padding: '0 28px',
              background: hovered ? '#15803D' : '#16A34A',
              color: '#fff',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              letterSpacing: '-0.01em',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
              transition: 'background 0.15s',
            }}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}
