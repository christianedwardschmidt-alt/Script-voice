import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { Syne, Inter } from 'next/font/google'
import Link from 'next/link'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'GuildWire — The Operating System for Independent Professionals',
  description: 'CRM, invoicing, AI companion, and community for serious independent professionals. Keep 97% of what you earn. Join as a founding member.',
}

const css = `
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lp a { text-decoration: none; }
.lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* Nav */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(10,26,15,0.94); backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(22,163,74,0.13);
}
.lp-nav-inner { display: flex; align-items: center; height: 64px; gap: 0; }
.lp-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
.lp-logo-text { display: inline-flex; flex-direction: column; line-height: 1; }
.lp-logo-name { font-family: var(--font-inter); font-weight: 800; font-size: 28px; letter-spacing: -0.02em; color: #fff; }
.lp-logo-tag { font-family: var(--font-inter); font-weight: 500; font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 3px; letter-spacing: 0.01em; }
.lp-nav-links { display: flex; gap: 28px; margin: 0 auto; }
.lp-nav-links a { color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500; transition: color 0.2s; }
.lp-nav-links a:hover { color: #86EFAC; }
.lp-btn-outline-nav { border: 1px solid #16A34A; color: #16A34A; padding: 7px 20px; border-radius: 8px;
  font-size: 14px; font-weight: 600; flex-shrink: 0; transition: all 0.18s; }
.lp-btn-outline-nav:hover { background: #16A34A; color: #fff; }

/* Hero */
.lp-hero { background: #0A1A0F; padding: 144px 0 100px; text-align: center; }
.lp-badge {
  display: inline-block; background: rgba(202,138,4,0.13); border: 1px solid rgba(202,138,4,0.38);
  color: #FCD34D; font-size: 13px; font-weight: 600; padding: 6px 18px; border-radius: 99px; margin-bottom: 32px;
}
.lp-headline {
  font-family: var(--font-syne); font-weight: 700;
  font-size: clamp(32px, 4vw, 52px); color: #fff; line-height: 1.08;
  letter-spacing: -0.02em; max-width: 820px; margin: 0 auto 20px; text-wrap: balance;
}
.lp-subheadline {
  font-size: clamp(16px, 2vw, 20px); color: #86EFAC; line-height: 1.65;
  max-width: 660px; margin: 0 auto 36px;
}
.lp-hero-ctas { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
.lp-btn-primary {
  background: #16A34A; color: #fff; padding: 14px 28px; border-radius: 10px;
  font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.18s;
}
.lp-btn-primary:hover { background: #15803D; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(22,163,74,0.35); }
.lp-btn-large { padding: 16px 36px; font-size: 17px; border-radius: 12px; }
.lp-link-sec { color: #fff; font-size: 15px; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; opacity: 0.8; transition: opacity 0.2s; }
.lp-link-sec:hover { opacity: 1; }

/* Proof bar */
.lp-proof {
  background: #0F2817; border-top: 1px solid rgba(22,163,74,0.15);
  border-bottom: 1px solid rgba(22,163,74,0.15); padding: 13px 0;
  text-align: center; color: rgba(255,255,255,0.45); font-size: 13px; letter-spacing: 0.025em;
}

/* Pillars */
.lp-pillars { background: #0F2817; padding: 88px 0; }
.lp-pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.lp-pillar {
  background: rgba(22,163,74,0.06); border: 1px solid rgba(22,163,74,0.14);
  border-radius: 16px; padding: 32px;
}
.lp-pillar-icon { margin-bottom: 20px; }
.lp-pillar h3 { font-family: var(--font-syne); font-weight: 700; font-size: 20px; letter-spacing: -0.01em; color: #fff; margin-bottom: 10px; }
.lp-pillar p { color: rgba(255,255,255,0.58); font-size: 15px; line-height: 1.65; }

/* Features */
.lp-features { background: #fff; padding: 88px 0; }
.lp-feature {
  display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center;
  padding: 64px 0; border-bottom: 1px solid #F3F4F6;
}
.lp-feature:last-child { border-bottom: none; }
.lp-feature-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #16A34A; margin-bottom: 10px;
}
.lp-feature-text h2 {
  font-family: var(--font-syne); font-weight: 700;
  font-size: clamp(22px, 2.5vw, 34px); color: #0A1A0F; line-height: 1.12;
  letter-spacing: -0.02em; margin-bottom: 16px; text-wrap: balance;
}
.lp-feature-text p { color: #4B5563; font-size: 16px; line-height: 1.72; }

/* Mockup */
.lp-mockup {
  background: #fff; border-radius: 14px; border: 1px solid #E5E7EB;
  box-shadow: 0 12px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
}
.lp-mockup-header {
  display: flex; align-items: center; gap: 6px; padding: 10px 14px;
  background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
}
.lp-mockup-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.lp-mockup-dot.r { background: #EF4444; }
.lp-mockup-dot.y { background: #F59E0B; }
.lp-mockup-dot.g { background: #10B981; }
.lp-mockup-row { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-bottom: 1px solid #F9FAFB; font-size: 0; }
.lp-mockup-row:last-child { border-bottom: none; }
.lp-mockup-avatar {
  width: 28px; height: 28px; border-radius: 7px; display: inline-flex; align-items: center;
  justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;
}

/* Pricing */
.lp-pricing { background: #0A1A0F; padding: 88px 0; }
.lp-founding-banner {
  background: #CA8A04; color: #1C1200; font-weight: 700; font-size: 15px;
  text-align: center; padding: 15px 24px; border-radius: 12px; margin-bottom: 52px;
}
.lp-section-title { font-family: var(--font-syne); font-weight: 700; font-size: clamp(26px, 3vw, 40px); letter-spacing: -0.02em; }
.lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.lp-plan {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 16px; padding: 32px; display: flex; flex-direction: column; position: relative;
}
.lp-plan-popular { background: #0F2817; border-color: #16A34A; }
.lp-popular-badge {
  position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
  background: #16A34A; color: #fff; font-size: 11px; font-weight: 700;
  padding: 4px 16px; border-radius: 99px; white-space: nowrap;
}
.lp-plan-label {
  font-family: var(--font-syne); font-weight: 700; font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase; color: #86EFAC; margin-bottom: 10px;
}
.lp-plan-price {
  font-family: var(--font-syne); font-weight: 700; font-size: 46px;
  letter-spacing: -0.03em; color: #fff; line-height: 1; margin-bottom: 6px;
}
.lp-plan-price span { font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.45); }
.lp-plan-desc { color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.55; margin-bottom: 24px; }
.lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; margin-bottom: 28px; }
.lp-plan-features li { display: flex; align-items: flex-start; gap: 9px; color: rgba(255,255,255,0.72); font-size: 14px; line-height: 1.4; }
.lp-check { color: #16A34A; font-weight: 700; flex-shrink: 0; }
.lp-btn-outline-plan {
  border: 1px solid rgba(255,255,255,0.22); color: #fff; padding: 12px 20px;
  border-radius: 8px; font-size: 14px; font-weight: 600; display: block;
  text-align: center; transition: all 0.18s; margin-top: auto;
}
.lp-btn-outline-plan:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.06); }
.lp-btn-primary-block {
  background: #16A34A; color: #fff; padding: 12px 20px; border-radius: 8px;
  font-size: 14px; font-weight: 700; display: block; text-align: center;
  transition: all 0.18s; margin-top: auto;
}
.lp-btn-primary-block:hover { background: #15803D; }

/* CTA 2 */
.lp-cta2 { background: #14532D; padding: 100px 0; }

/* Footer */
.lp-footer { background: #0A1A0F; border-top: 1px solid rgba(255,255,255,0.07); padding: 44px 0; }
.lp-footer-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
.lp-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 24px; }
.lp-footer-links a { color: rgba(255,255,255,0.42); font-size: 13px; transition: color 0.2s; }
.lp-footer-links a:hover { color: #86EFAC; }
.lp-footer-copy { color: rgba(255,255,255,0.22); font-size: 12px; }

/* Responsive */
@media (max-width: 900px) {
  .lp-pillars-grid { grid-template-columns: 1fr; }
  .lp-pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .lp-feature { grid-template-columns: 1fr; gap: 36px; }
  .lp-feature-visual-right { order: -1; }
  .lp-feature-text-right { order: 1; }
}
@media (max-width: 640px) {
  .lp-nav-links { display: none; }
  .lp-hero { padding: 120px 0 72px; }
}
`

export default async function HomePage() {
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`lp ${syne.variable} ${inter.variable}`} style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fff' }}>

        {/* ── NAV ─────────────────────────────── */}
        <nav className="lp-nav">
          <div className="lp-container lp-nav-inner">
            <Link href="/" className="lp-logo">
<div className="lp-logo-text">
                <span className="lp-logo-name">GuildWire</span>
                <span className="lp-logo-tag">Work free. Stay connected.</span>
              </div>
            </Link>
            <div className="lp-nav-links">
              <a href="#features">Features</a>
              <a href="#community">Community</a>
              <a href="#pricing">Pricing</a>
            </div>
            <Link href="/login" className="lp-btn-outline-nav">Sign In</Link>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="lp-badge">⚡ Founding member spots are limited — 30 days free, 20% off for life</div>
            <h1 className="lp-headline">The Operating System for Independent Professionals</h1>
            <p className="lp-subheadline">
              CRM, invoicing, AI companion, and a community of serious peers. All in one place. You keep 97% of what you earn.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/signup" className="lp-btn-primary">Join as a Founding Member</Link>
              <a href="#features" className="lp-link-sec">See how it works</a>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ────────────────────── */}
        <div className="lp-proof">
          <div className="lp-container">
            Join 2,400+ independent professionals already on GuildWire &nbsp;·&nbsp; CRM &nbsp;·&nbsp; Invoicing &nbsp;·&nbsp; AI &nbsp;·&nbsp; Community
          </div>
        </div>

        {/* ── THREE PILLARS ───────────────────── */}
        <section className="lp-pillars">
          <div className="lp-container">
            <div className="lp-pillars-grid">
              <div className="lp-pillar">
                <div className="lp-pillar-icon">
                  <svg width="42" height="44" viewBox="0 0 42 44" fill="none" aria-hidden="true">
                    <path d="M7 24 C7 35 13 41 21 41 C29 41 35 35 35 24 C35 18 30 16 21 16 C12 16 7 18 7 24Z" fill="rgba(22,163,74,0.12)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.7" strokeLinejoin="round"/>
                    <path d="M15 16 C15 10 27 10 27 16" stroke="rgba(255,255,255,0.78)" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
                    <circle cx="21" cy="8" r="3" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4"/>
                    <circle cx="21" cy="8" r="1.4" fill="#16A34A"/>
                    <line x1="18.5" y1="6" x2="15" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="23.5" y1="6" x2="27" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M13 26 C17 25 21 25 29 26" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round"/>
                    <path d="M12 31 C16 30 21 30 30 31" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round"/>
                    <path d="M13 21 C15 19 17 19 19 20" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Keep 97%</h3>
                <p>Stop giving 20% to platforms that don't work for you. GuildWire takes 3%.</p>
              </div>
              <div className="lp-pillar">
                <div className="lp-pillar-icon">
                  <svg width="36" height="44" viewBox="0 0 36 44" fill="none" aria-hidden="true">
                    <path d="M24 2 L11 23 L17 23 L13 42 L25 21 L19 21 Z" fill="rgba(22,163,74,0.14)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.7" strokeLinejoin="round"/>
                    <path d="M22 6 L13 23 L18 23 L15 38 L23 23 L18.5 23 Z" fill="rgba(22,163,74,0.28)"/>
                    <line x1="4" y1="7" x2="8" y2="11" stroke="rgba(134,239,172,0.72)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="7" x2="4" y2="11" stroke="rgba(134,239,172,0.72)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="30" y1="11" x2="34" y2="15" stroke="rgba(134,239,172,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="34" y1="11" x2="30" y2="15" stroke="rgba(134,239,172,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="4" cy="22" r="1.5" fill="rgba(22,163,74,0.7)"/>
                  </svg>
                </div>
                <h3>One Platform</h3>
                <p>CRM, invoicing, AI companion, and community. All in one place. Finally.</p>
              </div>
              <div className="lp-pillar">
                <div className="lp-pillar-icon">
                  <svg width="46" height="44" viewBox="0 0 46 44" fill="none" aria-hidden="true">
                    <rect x="2" y="18" width="15" height="8" rx="4" fill="rgba(22,163,74,0.12)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6"/>
                    <rect x="29" y="18" width="15" height="8" rx="4" fill="rgba(22,163,74,0.12)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6"/>
                    <path d="M15 18 C14 12 10 10 9 14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                    <path d="M31 18 C32 12 36 10 37 14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                    <path d="M17 16 L17 28 Q17 30 19 30 L27 30 Q29 30 29 28 L29 16 Q29 14 27 14 L19 14 Q17 14 17 16Z" fill="rgba(22,163,74,0.15)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6"/>
                    <line x1="21" y1="14" x2="21" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                    <line x1="25" y1="14" x2="25" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                    <circle cx="23" cy="22" r="2.5" fill="#16A34A"/>
                  </svg>
                </div>
                <h3>Real Community</h3>
                <p>A guild of serious independent professionals who actually get it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────── */}
        <section id="features" className="lp-features">
          <div className="lp-container">

            {/* CRM */}
            <div className="lp-feature">
              <div className="lp-feature-text">
                <div className="lp-feature-eyebrow">CRM</div>
                <h2>Your clients, organized.</h2>
                <p>Track every relationship from first contact to repeat client. Know where every deal stands, who needs a follow-up, and which clients drive the most revenue — without the bloat of enterprise CRM.</p>
              </div>
              <div className="lp-feature-visual">
                <div className="lp-mockup">
                  <div className="lp-mockup-header">
                    <span className="lp-mockup-dot r" /><span className="lp-mockup-dot y" /><span className="lp-mockup-dot g" />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-inter)' }}>Clients</span>
                  </div>
                  {[
                    { name: 'Apex Creative', stage: 'Active', c: '#16A34A' },
                    { name: 'Foundry Labs', stage: 'Proposal', c: '#CA8A04' },
                    { name: 'Meridian Co.', stage: 'Active', c: '#16A34A' },
                    { name: 'Blank Studio', stage: 'Lead', c: '#3B82F6' },
                  ].map((cl, i) => (
                    <div key={i} className="lp-mockup-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < 3 ? '1px solid #F9FAFB' : 'none' }}>
                      <div className="lp-mockup-avatar" style={{ background: cl.c + '22', color: cl.c }}>{cl.name[0]}</div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111827' }}>{cl.name}</span>
                      <span style={{ fontSize: 11, color: cl.c, background: cl.c + '18', padding: '2px 9px', borderRadius: 99, fontWeight: 600 }}>{cl.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Invoicing */}
            <div className="lp-feature">
              <div className="lp-feature-visual lp-feature-visual-right">
                <div className="lp-mockup">
                  <div className="lp-mockup-header">
                    <span className="lp-mockup-dot r" /><span className="lp-mockup-dot y" /><span className="lp-mockup-dot g" />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Invoice #0042</span>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontWeight: 600, letterSpacing: '0.08em' }}>BILL TO</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Apex Creative</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontWeight: 600, letterSpacing: '0.08em' }}>DUE DATE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Jul 15, 2026</div>
                      </div>
                    </div>
                    {[
                      { desc: 'Brand strategy', amt: '$3,200' },
                      { desc: 'Website copy', amt: '$1,800' },
                      { desc: 'Consulting (8h)', amt: '$1,600' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                        <span style={{ color: '#374151' }}>{item.desc}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{item.amt}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '2px solid #0A1A0F' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#16A34A' }}>$6,600</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-feature-text lp-feature-text-right">
                <div className="lp-feature-eyebrow">Invoicing</div>
                <h2>Get paid. Keep what you earn.</h2>
                <p>Create professional invoices in seconds and send them directly from GuildWire. Track payments, send reminders, and keep 97% of every dollar. No platform skimming 20% off the top.</p>
              </div>
            </div>

            {/* AI */}
            <div className="lp-feature">
              <div className="lp-feature-text">
                <div className="lp-feature-eyebrow">AI Companion</div>
                <h2>Your business, on autopilot.</h2>
                <p>Ask anything about your business in plain language. Get revenue insights, draft client emails, create tasks, and analyze your performance — all through a conversation. No dashboard-hopping required.</p>
              </div>
              <div className="lp-feature-visual">
                <div className="lp-mockup">
                  <div className="lp-mockup-header">
                    <span className="lp-mockup-dot r" /><span className="lp-mockup-dot y" /><span className="lp-mockup-dot g" />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>AI Companion</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ alignSelf: 'flex-end', background: '#0A1A0F', color: '#86EFAC', padding: '8px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.4 }}>
                      How much did I earn last month?
                    </div>
                    <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', color: '#374151', padding: '8px 13px', borderRadius: '3px 12px 12px 12px', fontSize: 13, maxWidth: '90%', lineHeight: 1.5 }}>
                      Last month you earned <strong>$14,800</strong> across 6 clients — up 13% from June. Apex Creative was your top client at $4,200.
                    </div>
                    <div style={{ alignSelf: 'flex-end', background: '#0A1A0F', color: '#86EFAC', padding: '8px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.4 }}>
                      Draft a follow-up for Foundry Labs
                    </div>
                    <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingLeft: 4 }}>
                      Drafting your email...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community */}
            <div id="community" className="lp-feature">
              <div className="lp-feature-visual lp-feature-visual-right">
                <div className="lp-mockup">
                  <div className="lp-mockup-header">
                    <span className="lp-mockup-dot r" /><span className="lp-mockup-dot y" /><span className="lp-mockup-dot g" />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Community</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Maya R.', tag: 'Designer', text: 'Finally landed a $15k brand project through a referral here. The guild delivers.', likes: 42 },
                      { name: 'James T.', tag: 'Strategist', text: 'Hot take: charging by the hour is self-sabotage. Here\'s why value pricing wins.', likes: 89 },
                    ].map((post, i) => (
                      <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '11px 13px', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#16A34A22', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                            {post.name[0]}
                          </div>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{post.name}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>{post.tag}</span>
                        </div>
                        <p style={{ color: '#374151', lineHeight: 1.5, marginBottom: 7 }}>{post.text}</p>
                        <div style={{ color: '#9CA3AF', fontSize: 11 }}>❤️ {post.likes} likes</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lp-feature-text lp-feature-text-right">
                <div className="lp-feature-eyebrow">Community</div>
                <h2>Find your guild.</h2>
                <p>Connect with independent professionals who take their craft seriously. Share insights, land referrals, and grow alongside people who actually understand what it means to build a practice on your own terms.</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── PRICING ─────────────────────────── */}
        <section id="pricing" className="lp-pricing">
          <div className="lp-container">
            <div className="lp-founding-banner">
              ⚡ Founding members lock in 20% off every plan forever. Spots are limited.
            </div>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 className="lp-section-title" style={{ color: '#fff' }}>Simple, honest pricing</h2>
              <p style={{ color: '#86EFAC', fontSize: 16, marginTop: 10 }}>Plus a 3% transaction fee on invoices — that's it. No hidden charges.</p>
            </div>
            <div className="lp-pricing-grid">
              {[
                {
                  name: 'Starter', price: '$50', popular: false,
                  desc: 'Everything you need to get started.',
                  features: ['CRM up to 50 clients', 'Unlimited invoices', 'Basic AI companion', 'Community access', '3% transaction fee'],
                },
                {
                  name: 'Pro', price: '$75', popular: true,
                  desc: 'For serious independents scaling their practice.',
                  features: ['Unlimited CRM clients', 'Advanced invoicing', 'Full AI companion', 'Priority community', 'Job board access', '3% transaction fee'],
                },
                {
                  name: 'Elite', price: '$150', popular: false,
                  desc: 'The full suite for high-volume professionals.',
                  features: ['Everything in Pro', 'White-label invoices', 'AI strategy advisor', 'Elite member network', 'Dedicated support', '3% transaction fee'],
                },
              ].map((plan) => (
                <div key={plan.name} className={`lp-plan${plan.popular ? ' lp-plan-popular' : ''}`}>
                  {plan.popular && <div className="lp-popular-badge">Most Popular</div>}
                  <div className="lp-plan-label">{plan.name}</div>
                  <div className="lp-plan-price">{plan.price}<span>/mo</span></div>
                  <p className="lp-plan-desc">{plan.desc}</p>
                  <ul className="lp-plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}><span className="lp-check">✓</span>{f}</li>
                    ))}
                  </ul>
                  {plan.popular
                    ? <Link href="/signup" className="lp-btn-primary-block">Start Free Trial</Link>
                    : <Link href="/signup" className="lp-btn-outline-plan">Get Started</Link>
                  }
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA 2 ───────────────────────────── */}
        <section className="lp-cta2">
          <div className="lp-container" style={{ textAlign: 'center' }}>
            <h2 className="lp-section-title" style={{ color: '#fff' }}>Ready to keep what you earn?</h2>
            <p style={{ color: '#86EFAC', fontSize: 18, marginTop: 14, marginBottom: 36, lineHeight: 1.5 }}>
              Join the founding guild. 30 days free. No card required.
            </p>
            <Link href="/signup" className="lp-btn-primary lp-btn-large">Claim your founding member spot</Link>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <div className="lp-logo">
<div className="lp-logo-text">
                <span className="lp-logo-name">GuildWire</span>
                <span className="lp-logo-tag">Work free. Stay connected.</span>
              </div>
            </div>
            <div className="lp-footer-links">
              <a href="#features">Features</a>
              <a href="#community">Community</a>
              <a href="#pricing">Pricing</a>
              <Link href="/signup">Founding Member</Link>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
            <p className="lp-footer-copy">© 2026 GuildWire</p>
          </div>
        </footer>

      </div>
    </>
  )
}
