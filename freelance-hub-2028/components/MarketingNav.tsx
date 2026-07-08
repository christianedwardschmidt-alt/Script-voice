'use client'

import Link from 'next/link'

export default function MarketingNav() {
  return (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        {/* Logo */}
        <Link href="/" className="mkt-logo">
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
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
          <Link href="/signup" className="mkt-nav-cta">Get started</Link>
        </div>
      </div>
    </nav>
  )
}
