import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* Left: dark brand panel */}
      <div style={{
        background: 'linear-gradient(160deg, #0A1A0F 0%, #0F2817 60%, #0A1A0F 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle green radial glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 'auto' }}>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: '#ffffff' }}>Guild</span>
            <span style={{ color: '#16A34A' }}>Wire</span>
          </div>
        </Link>

        {/* Main statement */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(202,138,4,0.12)',
            border: '1px solid rgba(202,138,4,0.3)',
            borderRadius: 99,
            padding: '5px 14px',
            marginBottom: 28,
            width: 'fit-content',
          }}>
            <span style={{ fontSize: 11, color: '#FCD34D', fontWeight: 600 }}>⚡ Founding member spots are limited</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(28px, 3vw, 40px)',
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 20,
            maxWidth: '420px',
          }}>
            The operating system for independent professionals.
          </h1>

          <p style={{
            fontSize: 15,
            color: 'rgba(134,239,172,0.8)',
            lineHeight: 1.7,
            maxWidth: '380px',
            marginBottom: 36,
          }}>
            CRM, invoicing, AI companion, and a community of serious peers — all in one place. Keep 97% of what you earn.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { value: '2,400+', label: 'Members' },
              { value: '97%', label: 'You keep' },
              { value: '30 days', label: 'Free trial' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  color: '#16A34A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '20px 24px',
        }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>
            &ldquo;GuildWire replaced five different tools for me. Now I spend less time managing admin and more time doing actual client work.&rdquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #14532D, #16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>M</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Maya Rodriguez</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Brand Strategist · Founding Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: white form panel */}
      <div style={{
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="background: linear-gradient(160deg"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
