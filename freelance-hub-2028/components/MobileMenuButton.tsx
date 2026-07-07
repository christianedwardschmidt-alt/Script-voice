'use client'

export default function MobileMenuButton() {
  return (
    <button
      className="mobile-menu-btn"
      onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
      style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        padding: 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-2)',
        borderRadius: 8,
        flexShrink: 0,
      }}
      aria-label="Open navigation"
    >
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="2" y1="4" x2="22" y2="4" />
        <line x1="2" y1="11" x2="22" y2="11" />
        <line x1="2" y1="18" x2="22" y2="18" />
      </svg>
    </button>
  )
}
