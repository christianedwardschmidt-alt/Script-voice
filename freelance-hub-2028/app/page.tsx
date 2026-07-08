import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import AnnouncementBar from '@/components/AnnouncementBar'
import MarketingNav from '@/components/MarketingNav'

export const metadata = {
  title: 'GuildWire — The Operating System for Independent Professionals',
  description: 'CRM, invoicing, AI companion, and community for serious independent professionals. Keep 97% of what you earn. Join as a founding member.',
}

export default async function HomePage() {
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: '#fff' }}>

      {/* ── ANNOUNCEMENT BAR ─────────────────── */}
      <AnnouncementBar />

      {/* ── NAV (client component for hover) ── */}
      <MarketingNav />

      {/* ── HERO ─────────────────────────────── */}
      <section style={{
        background: '#0A1A0F',
        minHeight: '90vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 44,
      }}>
        {/* Radial gradient blob */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />
        {/* Glow orb 1 */}
        <div style={{
          position: 'absolute', top: '20%', left: '15%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(22,163,74,0.08)', filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        {/* Glow orb 2 */}
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(202,138,4,0.05)', filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', padding: '80px 24px' }}>
          {/* Eyebrow badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#16A34A',
              display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
              Now accepting founding members
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 3.8vw, 52px)',
            fontWeight: 800, color: 'white', lineHeight: 1.12,
            letterSpacing: '-0.025em', marginBottom: 24,
            textWrap: 'balance',
          } as React.CSSProperties}>
            The Operating System for <span style={{ color: '#16A34A' }}>Independent</span>{' '}Professionals
          </h1>

          {/* Sub */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 20,
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.65,
            maxWidth: 520, margin: '0 auto 40px',
          }}>
            CRM, invoicing, AI companion, and a community of serious peers. Everything in one place — and you keep 97% of what you earn.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <Link href="/signup" className="mkt-btn-primary">Join as a founding member →</Link>
            <a href="#features" className="mkt-link-sec">See how it works</a>
          </div>

          {/* Trust line */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em' }}>
            No credit card required · Cancel anytime · 30-day free trial
          </p>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ──────────────── */}
      <div style={{
        background: '#0A1A0F',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '16px 0', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginRight: 16 }}>
            Trusted by independent professionals across
          </span>
          {['Engineering', 'Design', 'Consulting', 'Strategy', 'Writing', 'Marketing'].map((p, i, arr) => (
            <span key={p} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.42)' }}>
              {p}{i < arr.length - 1 && <span style={{ margin: '0 10px', opacity: 0.3 }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── THREE PILLARS ────────────────────── */}
      <section style={{ background: '#0A1A0F', padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', textAlign: 'center', marginBottom: 12 }}>Why GuildWire</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 3vw, 38px)', color: '#fff', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>
            Built for the way you actually work
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }} className="mkt-pillars-grid">
            {[
              {
                num: '01', title: 'Keep 97%',
                body: 'Stop giving 20% to platforms. GuildWire charges a flat 3% — nothing else.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 6v1m0 10v1m-3.5-6h7m-7 0a3.5 3.5 0 0 1 3.5-3.5m0 7A3.5 3.5 0 0 1 8.5 12"/>
                  </svg>
                ),
              },
              {
                num: '02', title: 'One Platform',
                body: 'CRM, invoicing, AI companion, and community. All in one place, all working together.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                ),
              },
              {
                num: '03', title: 'Real Community',
                body: 'A guild of serious independent professionals who get what it means to build on your own terms.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
            ].map((p) => (
              <div key={p.num} className="mkt-pillar">
                <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>{p.num}</div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {p.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 10, letterSpacing: '-0.01em' }}>{p.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section id="features" style={{ background: '#fff', padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* CRM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '72px 0', borderBottom: '1px solid #F3F4F6' }} className="mkt-feature-grid">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12, fontFamily: 'var(--font-body)' }}>CRM</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px,2.5vw,36px)', color: '#0A1A0F', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>Your clients, organized.</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#4B5563', lineHeight: 1.75 }}>Track every relationship from first contact to repeat client. Know where every deal stands, who needs a follow-up, and which clients drive the most revenue — without enterprise bloat.</p>
            </div>
            <div style={{ transform: 'rotate(-1deg)' }}>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-body)' }}>Clients</span>
                </div>
                {[
                  { name: 'Apex Creative', company: 'Agency', stage: 'Active', color: '#16A34A', revenue: '$6,200' },
                  { name: 'Foundry Labs', company: 'Tech', stage: 'Proposal', color: '#CA8A04', revenue: '$3,400' },
                  { name: 'Meridian Co.', company: 'Finance', stage: 'Active', color: '#16A34A', revenue: '$4,100' },
                  { name: 'Blank Studio', company: 'Design', stage: 'Lead', color: '#3B82F6', revenue: '$1,800' },
                ].map((cl, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < 3 ? '1px solid #F9FAFB' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: cl.color + '18', color: cl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, fontFamily: 'var(--font-body)' }}>{cl.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{cl.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{cl.company}</div>
                    </div>
                    <span style={{ fontSize: 11, color: cl.color, background: cl.color + '14', padding: '3px 9px', borderRadius: 6, fontWeight: 600, fontFamily: 'var(--font-body)', marginRight: 8 }}>{cl.stage}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)' }}>{cl.revenue}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#F9FAFB' }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>4 active clients</span>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, fontFamily: 'var(--font-body)' }}>+ Add client</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoicing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '72px 0', borderBottom: '1px solid #F3F4F6' }} className="mkt-feature-grid">
            <div style={{ transform: 'rotate(1deg)' }}>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-body)' }}>Invoice #0042</span>
                </div>
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#0A1A0F' }}>GuildWire</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2, fontFamily: 'var(--font-body)' }}>INVOICE</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#111827' }}>#0042</div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-body)' }}>SENT</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 3, fontFamily: 'var(--font-body)' }}>BILL TO</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14, fontFamily: 'var(--font-body)' }}>Apex Creative</div>
                  {[
                    { desc: 'Brand strategy', amt: '$3,200' },
                    { desc: 'Website copy', amt: '$1,800' },
                    { desc: 'Consulting (8h)', amt: '$1,600' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: '#374151' }}>{item.desc}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.amt}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid #0A1A0F' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', fontFamily: 'var(--font-body)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#16A34A' }}>$6,600</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12, fontFamily: 'var(--font-body)' }}>Invoicing</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px,2.5vw,36px)', color: '#0A1A0F', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>Get paid. Keep what you earn.</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#4B5563', lineHeight: 1.75 }}>Create professional invoices in seconds. Track payments, send reminders, and keep 97% of every dollar — no platform taking 20% off the top.</p>
            </div>
          </div>

          {/* AI Companion */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '72px 0', borderBottom: '1px solid #F3F4F6' }} className="mkt-feature-grid">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12, fontFamily: 'var(--font-body)' }}>AI Companion</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px,2.5vw,36px)', color: '#0A1A0F', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>Your business, on autopilot.</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#4B5563', lineHeight: 1.75 }}>Ask anything about your business in plain language. Revenue insights, client emails, task creation, performance analysis — all through a conversation.</p>
            </div>
            <div style={{ transform: 'rotate(-1deg)' }}>
              <div style={{ background: '#0A1A0F', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', background: '#0F2817', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontFamily: 'var(--font-body)' }}>AI Companion</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ alignSelf: 'flex-end', background: '#16A34A', color: 'white', padding: '9px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.45, fontFamily: 'var(--font-body)' }}>
                    What did I earn last month?
                  </div>
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', padding: '9px 13px', borderRadius: '3px 12px 12px 12px', fontSize: 13, maxWidth: '90%', lineHeight: 1.55, fontFamily: 'var(--font-body)' }}>
                    You billed <strong style={{ color: 'white' }}>$14,800</strong> in June — up 18% from May. Your top client was Apex Creative at $6,200. Three invoices are still outstanding totalling $3,400.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community */}
          <div id="community" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '72px 0' }} className="mkt-feature-grid">
            <div style={{ transform: 'rotate(1deg)' }}>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-body)' }}>Community</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'Maya R.', role: 'Designer', text: 'Finally landed a $15k brand project through a referral here. The guild delivers.', likes: 42, time: '2h ago' },
                    { name: 'James T.', role: 'Strategist', text: "Hot take: charging by the hour is self-sabotage. Here's why value pricing wins.", likes: 89, time: '4h ago' },
                  ].map((post, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16A34A18', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, fontFamily: 'var(--font-body)' }}>{post.name[0]}</div>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 13, fontFamily: 'var(--font-body)' }}>{post.name}</span>
                        <span style={{ fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{post.role}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto', fontFamily: 'var(--font-body)' }}>{post.time}</span>
                      </div>
                      <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.55, marginBottom: 8, fontFamily: 'var(--font-body)' }}>{post.text}</p>
                      <span style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'var(--font-body)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {post.likes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12, fontFamily: 'var(--font-body)' }}>Community</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px,2.5vw,36px)', color: '#0A1A0F', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 18 }}>Find your guild.</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#4B5563', lineHeight: 1.75 }}>Connect with independent professionals who take their craft seriously. Share insights, land referrals, and grow alongside people who actually understand building a practice on your own terms.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRICING ──────────────────────────── */}
      <section id="pricing" style={{ background: '#0A1A0F', padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Founding member banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(202,138,4,0.15), rgba(202,138,4,0.08))',
            border: '1px solid rgba(202,138,4,0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 24px', marginBottom: 56, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#CA8A04"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#FCD34D' }}>
              Founding members lock in 20% off every plan forever. Spots are limited.
            </span>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12 }}>PRICING</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,42px)', color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Simple, honest pricing</h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(134,239,172,0.75)', fontSize: 15 }}>Plus a 3% transaction fee on invoices — that&apos;s it. No hidden charges.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="mkt-pricing-grid">
            {[
              { name: 'Starter', price: '$49', popular: false, desc: 'Everything you need to get started as an independent.', features: ['CRM up to 50 clients', 'Unlimited invoices', 'Basic AI companion', 'Community access', '3% transaction fee'] },
              { name: 'Pro', price: '$99', popular: true, desc: 'For serious independents scaling their practice.', features: ['Unlimited CRM clients', 'Advanced invoicing', 'Full AI companion', 'Priority community', 'Job board access', '3% transaction fee'] },
              { name: 'Elite', price: '$179', popular: false, desc: 'The full suite for high-volume professionals.', features: ['Everything in Pro', 'White-label invoices', 'AI strategy advisor', 'Elite member network', 'Dedicated support', '3% transaction fee'] },
            ].map((plan) => (
              <div key={plan.name} style={{
                background: plan.popular ? '#0F2817' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${plan.popular ? '#16A34A' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 20, padding: 36,
                display: 'flex', flexDirection: 'column', position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#16A34A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 99, whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>Most Popular</div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86EFAC', marginBottom: 10 }}>{plan.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1, marginBottom: 6 }}>
                  {plan.price}<span style={{ fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>/mo</span>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.48)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{plan.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, flex: 1, marginBottom: 32 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.45, fontFamily: 'var(--font-body)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`mkt-plan-btn ${plan.popular ? 'mkt-plan-btn-primary' : 'mkt-plan-btn-outline'}`}>
                  {plan.popular ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECOND CTA ───────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0F2817 0%, #0A1A0F 100%)', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12 }}>Get started today</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(32px,4vw,56px)', color: 'white', letterSpacing: '-0.03em', marginBottom: 20 }}>
            Ready to keep what you earn?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(134,239,172,0.75)', fontSize: 16, lineHeight: 1.65, maxWidth: 480, margin: '0 auto 36px' }}>
            Join the founding guild. 30 days free, no credit card required. Lock in your founding member discount.
          </p>
          <Link href="/signup" className="mkt-btn-primary-lg">Claim your founding member spot</Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer style={{ background: '#050D07', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '52px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }} className="mkt-footer-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 8 }}>
                <span style={{ color: '#ffffff' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#16A34A', marginBottom: 8, letterSpacing: '0.02em' }}>Work free. Stay yours.</p>
              <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.6, maxWidth: 240 }}>The operating system for independent professionals. Keep 97% of what you earn.</p>
            </div>
            {[
              { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Community', href: '#community' }, { label: 'Get started', href: '/signup' }] },
              { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }] },
              { title: 'Legal', links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Security', href: '#' }, { label: 'Cookies', href: '#' }] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l.label} href={l.href} className="mkt-footer-link">{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="mkt-footer-bottom">
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© 2026 GuildWire. All rights reserved.</p>
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Built for independent professionals.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
