import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'
import Link from 'next/link'

export const metadata = {
  title: 'Veruno — The Operating System for the Independent Professional',
  description: 'CRM, invoicing, an AI companion, and a community of serious peers — one instrument, engineered so you keep 97% of what you earn.',
  robots: { index: false, follow: false },
}

const css = `
.vp, .vp *, .vp *::before, .vp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.vp {
  --ink-0: #0A0E16;
  --ink-1: #0E1420;
  --ink-2: #161C29;
  --ink-3: #1A2436;
  --hair: rgba(255,255,255,0.08);
  --hair-strong: rgba(255,255,255,0.14);
  --text-0: #F5F4F1;
  --text-1: rgba(245,244,241,0.62);
  --text-2: rgba(245,244,241,0.38);
  --gold: #C9A24B;
  background: var(--ink-1);
  font-family: var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.vp a { text-decoration: none; }
.vp-container { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
.vp-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--text-2);
}

/* ── NAV ─────────────────────────────────── */
.vp-nav {
  position: sticky; top: 0; z-index: 50; height: 72px;
  background: rgba(10,14,22,0.82);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-bottom: 1px solid var(--hair);
}
.vp-nav-inner {
  max-width: 1180px; margin: 0 auto; padding: 0 32px; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
}
.vp-wordmark { font-size: 22px; font-weight: 800; letter-spacing: -0.04em; color: var(--text-0); }
.vp-nav-links { display: flex; gap: 34px; align-items: center; }
.vp-nav-link { font-size: 14px; color: var(--text-1); transition: color 0.15s; }
.vp-nav-link:hover { color: var(--text-0); }
.vp-nav-signin { font-size: 14px; color: var(--text-1); transition: color 0.15s; }
.vp-nav-signin:hover { color: var(--text-0); }
.vp-btn-gold {
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--gold); color: #1A1508;
  font-weight: 600; letter-spacing: -0.01em; white-space: nowrap;
  border-radius: 10px; transition: all 0.18s ease;
  box-shadow: 0 1px 4px rgba(201,162,75,0.3);
}
.vp-btn-gold:hover { background: #D6B05F; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,162,75,0.4); }
.vp-nav-cta { height: 40px; padding: 0 20px; font-size: 14px; }

/* ── HERO ────────────────────────────────── */
.vp-hero {
  background: linear-gradient(145deg, var(--ink-1) 0%, var(--ink-3) 55%, var(--ink-0) 100%);
  padding: 96px 0 120px;
}
.vp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 64px; align-items: center; }
.vp-hero-headline {
  font-family: var(--font-body); font-weight: 800; font-size: clamp(34px, 4.4vw, 58px);
  line-height: 1.06; letter-spacing: -0.035em; color: var(--text-0);
  margin: 20px 0 24px; text-wrap: balance;
}
.vp-hero-sub {
  font-size: 17px; line-height: 1.7; color: var(--text-1); max-width: 480px; margin-bottom: 36px;
}
.vp-hero-ctas { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; margin-bottom: 28px; }
.vp-hero-cta-primary { height: 50px; padding: 0 30px; font-size: 15px; }
.vp-link-ghost {
  font-size: 14px; font-weight: 500; color: var(--text-1);
  border-bottom: 1px solid var(--hair-strong); padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
}
.vp-link-ghost:hover { color: var(--text-0); border-color: var(--text-1); }
.vp-hero-note { font-size: 13px; color: var(--text-2); max-width: 420px; line-height: 1.6; }

/* ── HERO VISUAL (product window) ──────────── */
.vp-window {
  background: #ffffff; border-radius: 14px; overflow: hidden;
  border: 1px solid #E5E7EB;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.22);
}
.vp-window-chrome {
  display: flex; align-items: center; gap: 6px; padding: 12px 16px;
  background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
}
.vp-wc-dot { width: 9px; height: 9px; border-radius: 50%; }
.vp-window-title { font-size: 11px; color: #9CA3AF; margin-left: 8px; font-weight: 500; }
.vp-window-body { padding: 22px 22px 0; }
.vp-kpi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-bottom: 20px; }
.vp-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 6px; }
.vp-kpi-value { font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.vp-kpi-trend { font-size: 12px; color: #16A34A; margin-top: 4px; }
.vp-kpi-trend.neutral { color: #6B7280; }
.vp-week {
  margin: 0 22px 22px; padding: 18px 20px; border-radius: 10px;
  background: linear-gradient(145deg, #0E1420 0%, #1A2436 50%, #0A0E16 100%);
}
.vp-week-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 14px; }
.vp-week-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.vp-week-stat-label { font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.38); margin-bottom: 4px; }
.vp-week-stat-value { font-size: 17px; font-weight: 700; color: var(--gold); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
.vp-week-bar { margin-top: 6px; height: 3px; background: rgba(255,255,255,0.14); border-radius: 99px; overflow: hidden; }
.vp-week-bar-fill { height: 100%; background: var(--gold); border-radius: 99px; }

/* ── TRUST STRIP ─────────────────────────── */
.vp-trust {
  background: var(--ink-0); border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair);
  padding: 18px 0; text-align: center; color: var(--text-2); font-size: 12.5px;
  letter-spacing: 0.05em; font-weight: 500;
}

/* ── PILLARS ─────────────────────────────── */
.vp-pillars { background: var(--ink-1); padding: 108px 0; }
.vp-section-title {
  font-family: var(--font-body); font-weight: 800; font-size: clamp(26px, 3vw, 40px);
  color: var(--text-0); letter-spacing: -0.03em; text-align: center; margin: 14px 0 60px; text-wrap: balance;
}
.vp-pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.vp-pillar { background: var(--ink-2); border: 1px solid var(--hair); border-radius: 14px; padding: 34px 30px; }
.vp-pillar-num { font-size: 12px; font-weight: 700; color: var(--text-2); letter-spacing: 0.04em; margin-bottom: 18px; font-variant-numeric: tabular-nums; }
.vp-pillar h3 { font-family: var(--font-body); font-weight: 700; font-size: 19px; letter-spacing: -0.015em; color: var(--text-0); margin-bottom: 10px; }
.vp-pillar p { color: var(--text-1); font-size: 14.5px; line-height: 1.7; }

/* ── FEATURES ─────────────────────────────── */
.vp-features { background: var(--ink-2); padding: 108px 0; }
.vp-feature {
  display: grid; grid-template-columns: 1fr 1fr; gap: 76px; align-items: center;
  padding: 76px 0; border-bottom: 1px solid var(--hair);
}
.vp-feature:first-child { padding-top: 0; }
.vp-feature:last-child { border-bottom: none; padding-bottom: 0; }
.vp-feature-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-2); margin-bottom: 14px; }
.vp-feature-text h2 {
  font-family: var(--font-body); font-weight: 800; font-size: clamp(23px, 2.3vw, 33px);
  color: var(--text-0); line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 16px; text-wrap: balance;
}
.vp-feature-text p { color: var(--text-1); font-size: 15px; line-height: 1.8; }
.vp-mockup { background: #fff; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 16px 44px rgba(0,0,0,0.28); overflow: hidden; }
.vp-mockup-header { display: flex; align-items: center; gap: 6px; padding: 11px 14px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; }
.vp-mockup-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #F9FAFB; }
.vp-mockup-row:last-child { border-bottom: none; }

/* ── QUOTE ───────────────────────────────── */
.vp-quote { background: var(--ink-1); padding: 100px 0; }
.vp-quote-mark { font-size: 48px; color: var(--hair-strong); font-weight: 800; line-height: 1; margin-bottom: 12px; }
.vp-quote-text {
  font-family: var(--font-body); font-weight: 600; font-size: clamp(22px, 2.6vw, 32px);
  color: var(--text-0); line-height: 1.45; letter-spacing: -0.015em; max-width: 780px; text-wrap: balance;
}
.vp-quote-attr { margin-top: 26px; font-size: 14px; color: var(--text-2); }
.vp-quote-attr strong { color: var(--text-1); font-weight: 600; }

/* ── PRICING ─────────────────────────────── */
.vp-pricing { background: var(--ink-2); padding: 108px 0; }
.vp-pricing-note { text-align: center; color: var(--text-1); font-size: 14.5px; margin: 0 auto 56px; max-width: 460px; line-height: 1.6; }
.vp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.vp-plan { background: var(--ink-1); border: 1px solid var(--hair); border-radius: 14px; padding: 32px; display: flex; flex-direction: column; position: relative; }
.vp-plan-recommended { border-color: var(--hair-strong); background: var(--ink-0); }
.vp-plan-recommended-tag {
  position: absolute; top: -11px; left: 32px; background: var(--ink-0); border: 1px solid var(--hair-strong);
  color: var(--text-0); font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 99px;
}
.vp-plan-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); margin-bottom: 14px; }
.vp-plan-price { font-family: var(--font-body); font-weight: 800; font-size: 42px; letter-spacing: -0.03em; color: var(--text-0); line-height: 1; margin-bottom: 8px; }
.vp-plan-price span { font-size: 16px; font-weight: 400; color: var(--text-2); }
.vp-plan-desc { color: var(--text-1); font-size: 13.5px; line-height: 1.6; margin-bottom: 26px; }
.vp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 11px; flex: 1; margin-bottom: 30px; }
.vp-plan-features li { display: flex; align-items: flex-start; gap: 9px; color: var(--text-1); font-size: 13.5px; line-height: 1.5; }
.vp-check { color: var(--text-2); font-weight: 700; flex-shrink: 0; }
.vp-plan-btn {
  display: block; text-align: center; padding: 12px 20px; border-radius: 9px;
  font-size: 14px; font-weight: 600; margin-top: auto; transition: all 0.18s ease;
}
.vp-plan-btn-outline { border: 1px solid var(--hair-strong); color: var(--text-1); }
.vp-plan-btn-outline:hover { border-color: var(--text-1); color: var(--text-0); }

/* ── FINAL CTA ────────────────────────────── */
.vp-cta2 { background: var(--ink-0); padding: 120px 0; text-align: center; }
.vp-cta2 p { color: var(--text-1); font-size: 16px; line-height: 1.7; max-width: 460px; margin: 16px auto 40px; }

/* ── FOOTER ──────────────────────────────── */
.vp-footer { background: var(--ink-0); border-top: 1px solid var(--hair); padding: 56px 0 40px; }
.vp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 44px; }
.vp-footer-brand-desc { color: var(--text-2); font-size: 13px; line-height: 1.7; max-width: 240px; margin-top: 10px; }
.vp-footer-col-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); margin-bottom: 15px; }
.vp-footer-col-links { display: flex; flex-direction: column; gap: 11px; }
.vp-footer-col-links a { color: var(--text-1); font-size: 13px; transition: color 0.2s; }
.vp-footer-col-links a:hover { color: var(--text-0); }
.vp-footer-bottom { border-top: 1px solid var(--hair); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; }
.vp-footer-copy { color: var(--text-2); font-size: 12px; }

/* ── MOTION ───────────────────────────────── */
@keyframes vpFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.vp-in { opacity: 0; animation: vpFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
@media (prefers-reduced-motion: reduce) { .vp-in { animation: none; opacity: 1; } }

/* ── RESPONSIVE ───────────────────────────── */
@media (max-width: 980px) {
  .vp-hero-grid { grid-template-columns: 1fr; gap: 56px; }
  .vp-hero-note { max-width: none; }
  .vp-pillars-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .vp-pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .vp-feature { grid-template-columns: 1fr; gap: 36px; }
  .vp-feature-visual-right { order: -1; }
  .vp-footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .vp-nav-links { display: none; }
  .vp-hero { padding: 64px 0 80px; }
  .vp-footer-grid { grid-template-columns: 1fr; }
  .vp-footer-bottom { flex-direction: column; gap: 10px; text-align: center; }
}
`

const weekStats = [
  { label: 'Invoiced', val: '$4,200', pct: 87 },
  { label: 'Collected', val: '$3,100', pct: 64 },
  { label: 'Hours', val: '38.5h', pct: 96 },
  { label: 'Rate', val: '$140/h', pct: 72 },
]

export default async function VerunoPreviewPage() {
  const user = await getUser()
  if (!isAdmin(user)) redirect('/dashboard')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vp">

        {/* ── NAV ─────────────────────────────── */}
        <nav className="vp-nav">
          <div className="vp-nav-inner">
            <Link href="/veruno-preview" className="vp-wordmark">Veruno</Link>
            <div className="vp-nav-links">
              <a href="#features" className="vp-nav-link">Features</a>
              <a href="#community" className="vp-nav-link">Community</a>
              <a href="#pricing" className="vp-nav-link">Pricing</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <Link href="/login" className="vp-nav-signin">Sign in</Link>
              <Link href="/signup" className="vp-btn-gold vp-nav-cta">Request access</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────── */}
        <section className="vp-hero">
          <div className="vp-container">
            <div className="vp-hero-grid">
              <div>
                <div className="vp-eyebrow vp-in">Veruno — for independent professionals</div>
                <h1 className="vp-hero-headline vp-in" style={{ animationDelay: '80ms' }}>
                  The operating system for the independent professional.
                </h1>
                <p className="vp-hero-sub vp-in" style={{ animationDelay: '150ms' }}>
                  CRM, invoicing, an AI companion, and a community of serious peers — one instrument, engineered so you keep 97% of what you earn.
                </p>
                <div className="vp-hero-ctas vp-in" style={{ animationDelay: '220ms' }}>
                  <Link href="/signup" className="vp-btn-gold vp-hero-cta-primary">Request access</Link>
                  <a href="#features" className="vp-link-ghost">See how it works</a>
                </div>
                <p className="vp-hero-note vp-in" style={{ animationDelay: '280ms' }}>
                  Presently by invitation. A limited number of practices onboard each season.
                </p>
              </div>

              <div className="vp-in" style={{ animationDelay: '200ms' }}>
                <div className="vp-window">
                  <div className="vp-window-chrome">
                    <span className="vp-wc-dot" style={{ background: '#EF4444' }} />
                    <span className="vp-wc-dot" style={{ background: '#F59E0B' }} />
                    <span className="vp-wc-dot" style={{ background: '#10B981' }} />
                    <span className="vp-window-title">Dashboard</span>
                  </div>
                  <div className="vp-window-body">
                    <div className="vp-kpi-row">
                      <div>
                        <div className="vp-kpi-label">Revenue</div>
                        <div className="vp-kpi-value">$9,800</div>
                        <div className="vp-kpi-trend">+18% vs last year</div>
                      </div>
                      <div>
                        <div className="vp-kpi-label">Active clients</div>
                        <div className="vp-kpi-value">14</div>
                        <div className="vp-kpi-trend neutral">+3 this month</div>
                      </div>
                    </div>
                    <div className="vp-week">
                      <div className="vp-week-label">This week</div>
                      <div className="vp-week-grid">
                        {weekStats.map(s => (
                          <div key={s.label}>
                            <div className="vp-week-stat-label">{s.label}</div>
                            <div className="vp-week-stat-value">{s.val}</div>
                            <div className="vp-week-bar"><div className="vp-week-bar-fill" style={{ width: `${s.pct}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ─────────────────────── */}
        <div className="vp-trust">
          <div className="vp-container">
            CRM &nbsp;·&nbsp; INVOICING &nbsp;·&nbsp; AI COMPANION &nbsp;·&nbsp; COMMUNITY &nbsp;·&nbsp; TAX TOOLS &nbsp;·&nbsp; JOB BOARD &nbsp;·&nbsp; EDUCATION
          </div>
        </div>

        {/* ── PILLARS ─────────────────────────── */}
        <section className="vp-pillars">
          <div className="vp-container">
            <div className="vp-eyebrow" style={{ textAlign: 'center' }}>Why Veruno</div>
            <h2 className="vp-section-title">Built like an instrument, not an app.</h2>
            <div className="vp-pillars-grid">
              <div className="vp-pillar">
                <div className="vp-pillar-num">01</div>
                <h3>Keep 97%</h3>
                <p>A flat 3% — nothing else. No listing fees, no lead fees, no arbitrary cuts on the work you already did.</p>
              </div>
              <div className="vp-pillar">
                <div className="vp-pillar-num">02</div>
                <h3>One instrument</h3>
                <p>CRM, invoicing, an AI companion, and community — designed together from the start, not bolted onto each other.</p>
              </div>
              <div className="vp-pillar">
                <div className="vp-pillar-num">03</div>
                <h3>A real guild</h3>
                <p>Independent professionals who take the craft seriously. Not a feed of strangers — a guild that actually delivers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────── */}
        <section id="features" className="vp-features">
          <div className="vp-container">

            {/* CRM */}
            <div className="vp-feature">
              <div className="vp-feature-text">
                <div className="vp-feature-eyebrow">CRM</div>
                <h2>Your clients, organized.</h2>
                <p>Track every relationship from first contact to repeat client. Know where every deal stands, who needs a follow-up, and which clients drive the most revenue — without the bloat of enterprise CRM.</p>
              </div>
              <div className="vp-feature-visual">
                <div className="vp-mockup">
                  <div className="vp-mockup-header">
                    <span className="vp-wc-dot" style={{ background: '#EF4444' }} /><span className="vp-wc-dot" style={{ background: '#F59E0B' }} /><span className="vp-wc-dot" style={{ background: '#10B981' }} />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Clients</span>
                  </div>
                  {[
                    { name: 'Apex Creative', stage: 'Active', c: '#16A34A' },
                    { name: 'Foundry Labs', stage: 'Proposal', c: '#CA8A04' },
                    { name: 'Meridian Co.', stage: 'Active', c: '#16A34A' },
                    { name: 'Blank Studio', stage: 'Lead', c: '#3B82F6' },
                  ].map((cl, i) => (
                    <div key={i} className="vp-mockup-row" style={{ borderBottom: i < 3 ? '1px solid #F9FAFB' : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: cl.c + '18', color: cl.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{cl.name[0]}</div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111827' }}>{cl.name}</span>
                      <span style={{ fontSize: 11, color: cl.c, background: cl.c + '14', padding: '3px 9px', borderRadius: 6, fontWeight: 600 }}>{cl.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Invoicing */}
            <div className="vp-feature">
              <div className="vp-feature-visual vp-feature-visual-right">
                <div className="vp-mockup">
                  <div className="vp-mockup-header">
                    <span className="vp-wc-dot" style={{ background: '#EF4444' }} /><span className="vp-wc-dot" style={{ background: '#F59E0B' }} /><span className="vp-wc-dot" style={{ background: '#10B981' }} />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Invoice #0042</span>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em' }}>BILL TO</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Apex Creative</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em' }}>DUE DATE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Jul 15, 2026</div>
                      </div>
                    </div>
                    {[
                      { desc: 'Brand strategy', amt: '$3,200' },
                      { desc: 'Website copy', amt: '$1,800' },
                      { desc: 'Consulting (8h)', amt: '$1,600' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                        <span style={{ color: '#374151' }}>{item.desc}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{item.amt}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid #111827' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>$6,600</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="vp-feature-text vp-feature-text-right">
                <div className="vp-feature-eyebrow">Invoicing</div>
                <h2>Get paid. Keep what you earn.</h2>
                <p>Create professional invoices in seconds and send them directly from Veruno. Track payments, send reminders, and keep 97% of every dollar — no platform skimming 20% off the top.</p>
              </div>
            </div>

            {/* AI */}
            <div className="vp-feature">
              <div className="vp-feature-text">
                <div className="vp-feature-eyebrow">AI Companion</div>
                <h2>Your business, on autopilot.</h2>
                <p>Ask anything about your business in plain language. Get revenue insights, draft client emails, create tasks, and analyze your performance — all through a conversation. No dashboard-hopping required.</p>
              </div>
              <div className="vp-feature-visual">
                <div className="vp-mockup">
                  <div className="vp-mockup-header">
                    <span className="vp-wc-dot" style={{ background: '#EF4444' }} /><span className="vp-wc-dot" style={{ background: '#F59E0B' }} /><span className="vp-wc-dot" style={{ background: '#10B981' }} />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>AI Companion</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ alignSelf: 'flex-end', background: '#111827', color: '#F5F4F1', padding: '9px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.45 }}>
                      How much did I earn last month?
                    </div>
                    <div style={{ alignSelf: 'flex-start', background: '#F8FAFC', border: '1px solid #F3F4F6', color: '#374151', padding: '9px 13px', borderRadius: '3px 12px 12px 12px', fontSize: 13, maxWidth: '90%', lineHeight: 1.55 }}>
                      Last month you earned <strong style={{ color: '#111827' }}>$14,800</strong> across 6 clients — up 13% from June. Apex Creative was your top client at $4,200.
                    </div>
                    <div style={{ alignSelf: 'flex-end', background: '#111827', color: '#F5F4F1', padding: '9px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.45 }}>
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
            <div id="community" className="vp-feature">
              <div className="vp-feature-visual vp-feature-visual-right">
                <div className="vp-mockup">
                  <div className="vp-mockup-header">
                    <span className="vp-wc-dot" style={{ background: '#EF4444' }} /><span className="vp-wc-dot" style={{ background: '#F59E0B' }} /><span className="vp-wc-dot" style={{ background: '#10B981' }} />
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Community</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Maya R.', tag: 'Designer', text: 'Finally landed a $15k brand project through a referral here. The guild delivers.', likes: 42 },
                      { name: 'James T.', tag: 'Strategist', text: "Hot take: charging by the hour is self-sabotage. Here's why value pricing wins.", likes: 89 },
                    ].map((post, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', fontSize: 13, border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#11182714', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                            {post.name[0]}
                          </div>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{post.name}</span>
                          <span style={{ fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{post.tag}</span>
                        </div>
                        <p style={{ color: '#374151', lineHeight: 1.55, marginBottom: 8 }}>{post.text}</p>
                        <div style={{ color: '#9CA3AF', fontSize: 11 }}>❤ {post.likes} likes</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="vp-feature-text vp-feature-text-right">
                <div className="vp-feature-eyebrow">Community</div>
                <h2>Find your guild.</h2>
                <p>Connect with independent professionals who take their craft seriously. Share insights, land referrals, and grow alongside people who actually understand what it means to build a practice on your own terms.</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── QUOTE ───────────────────────────── */}
        <section className="vp-quote">
          <div className="vp-container">
            <div className="vp-quote-mark">"</div>
            <p className="vp-quote-text">
              Veruno is the first platform that felt built for how I actually run my practice — not for a platform's growth metrics.
            </p>
            <div className="vp-quote-attr"><strong>Maya R.</strong> — Brand Strategist, Veruno member since 2026</div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────── */}
        <section id="pricing" className="vp-pricing">
          <div className="vp-container">
            <div style={{ textAlign: 'center' }}>
              <div className="vp-eyebrow">Pricing</div>
              <h2 className="vp-section-title" style={{ marginBottom: 12 }}>Simple, honest pricing</h2>
            </div>
            <p className="vp-pricing-note">Plus a 3% transaction fee on invoices — that&apos;s it. Founding members lock in these rates for life.</p>
            <div className="vp-pricing-grid">
              {[
                {
                  name: 'Starter', price: '$50', recommended: false,
                  desc: 'Everything you need to get started as an independent.',
                  features: ['CRM up to 50 clients', 'Unlimited invoices', 'Basic AI companion', 'Community access', '3% transaction fee'],
                },
                {
                  name: 'Pro', price: '$75', recommended: true,
                  desc: 'For serious independents scaling their practice.',
                  features: ['Unlimited CRM clients', 'Advanced invoicing', 'Full AI companion', 'Priority community', 'Job board access', '3% transaction fee'],
                },
                {
                  name: 'Elite', price: '$150', recommended: false,
                  desc: 'The full suite for high-volume professionals.',
                  features: ['Everything in Pro', 'White-label invoices', 'AI strategy advisor', 'Elite member network', 'Dedicated support', '3% transaction fee'],
                },
              ].map((plan) => (
                <div key={plan.name} className={`vp-plan${plan.recommended ? ' vp-plan-recommended' : ''}`}>
                  {plan.recommended && <div className="vp-plan-recommended-tag">Recommended</div>}
                  <div className="vp-plan-label">{plan.name}</div>
                  <div className="vp-plan-price">{plan.price}<span>/mo</span></div>
                  <p className="vp-plan-desc">{plan.desc}</p>
                  <ul className="vp-plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}><span className="vp-check">✓</span>{f}</li>
                    ))}
                  </ul>
                  {plan.recommended
                    ? <Link href="/signup" className="vp-btn-gold vp-plan-btn" style={{ display: 'block' }}>Start free trial</Link>
                    : <Link href="/signup" className="vp-plan-btn vp-plan-btn-outline">Get started</Link>
                  }
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────── */}
        <section className="vp-cta2">
          <div className="vp-container">
            <div className="vp-eyebrow" style={{ textAlign: 'center' }}>Get started</div>
            <h2 className="vp-section-title" style={{ marginBottom: 0 }}>Ready to keep what you earn?</h2>
            <p>Request access to Veruno. Thirty days free, no card required — lock in your founding member rate for life.</p>
            <Link href="/signup" className="vp-btn-gold vp-hero-cta-primary">Request access</Link>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────── */}
        <footer className="vp-footer">
          <div className="vp-container">
            <div className="vp-footer-grid">
              <div>
                <div className="vp-wordmark" style={{ fontSize: 18 }}>Veruno</div>
                <p className="vp-footer-brand-desc">The operating system for the independent professional. Keep 97% of what you earn.</p>
              </div>
              <div>
                <div className="vp-footer-col-title">Product</div>
                <div className="vp-footer-col-links">
                  <a href="#features">Features</a>
                  <a href="#pricing">Pricing</a>
                  <a href="#community">Community</a>
                  <Link href="/signup">Get started</Link>
                </div>
              </div>
              <div>
                <div className="vp-footer-col-title">Company</div>
                <div className="vp-footer-col-links">
                  <a href="#">About</a>
                  <a href="#">Blog</a>
                  <a href="#">Careers</a>
                  <a href="#">Contact</a>
                </div>
              </div>
              <div>
                <div className="vp-footer-col-title">Legal</div>
                <div className="vp-footer-col-links">
                  <a href="#">Privacy</a>
                  <a href="#">Terms</a>
                  <a href="#">Security</a>
                  <a href="#">Cookies</a>
                </div>
              </div>
            </div>
            <div className="vp-footer-bottom">
              <p className="vp-footer-copy">© 2026 Veruno. All rights reserved.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="#" style={{ color: 'var(--text-2)', fontSize: 12 }}>Privacy</a>
                <a href="#" style={{ color: 'var(--text-2)', fontSize: 12 }}>Terms</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
