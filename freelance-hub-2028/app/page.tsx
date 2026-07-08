import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import AnnouncementBar from '@/components/AnnouncementBar'
import MarketingNav from '@/components/MarketingNav'

export const metadata = {
  title: 'GuildWire — The Operating System for Independent Professionals',
  description: 'CRM, invoicing, AI companion, and community for serious independent professionals. Keep 97% of what you earn. Join as a founding member.',
}

const css = `
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lp a { text-decoration: none; }
.lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* Hero */
.lp-hero {
  background: radial-gradient(ellipse at 50% -10%, #14532D 0%, #0A1A0F 58%);
  padding: 64px 0 72px; min-height: 80vh;
  display: flex; flex-direction: column; justify-content: center;
}
.lp-badge {
  display: inline-block; background: rgba(202,138,4,0.12); border: 1px solid rgba(202,138,4,0.35);
  color: #FCD34D; font-size: 13px; font-weight: 600; padding: 6px 18px; border-radius: 99px; margin-bottom: 32px;
  letter-spacing: 0.01em;
}
.lp-headline {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700;
  font-size: clamp(36px, 5vw, 64px); color: #fff; line-height: 1.05;
  letter-spacing: -0.02em; max-width: 760px; margin: 0 0 22px; text-wrap: balance;
}
.lp-subheadline {
  font-size: clamp(15px, 1.8vw, 18px); color: rgba(134,239,172,0.85); line-height: 1.65;
  max-width: 560px; margin: 0 0 40px; font-family: var(--font-inter);
}
.lp-hero-ctas { display: flex; align-items: center; justify-content: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 48px; }
.lp-btn-primary {
  background: #16A34A; color: #fff; padding: 14px 28px; border-radius: 12px;
  font-weight: 600; font-size: 15px; display: inline-block; transition: all 0.18s;
  font-family: var(--font-inter); box-shadow: 0 4px 16px rgba(22,163,74,0.35);
  letter-spacing: -0.01em;
}
.lp-btn-primary:hover { background: #15803D; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(22,163,74,0.45); }
.lp-btn-large { padding: 16px 36px; font-size: 16px; border-radius: 12px; }
.lp-link-sec {
  color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500;
  border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 1px;
  transition: color 0.2s, border-color 0.2s; font-family: var(--font-inter);
}
.lp-link-sec:hover { color: #fff; border-color: rgba(255,255,255,0.5); }

/* Social proof avatars */
.lp-social-proof {
  display: flex; align-items: center; justify-content: flex-start; gap: 12px;
  color: rgba(255,255,255,0.45); font-size: 13px; font-family: var(--font-inter);
}
.lp-avatars { display: flex; align-items: center; }
.lp-avatar {
  width: 28px; height: 28px; border-radius: 50%; border: 2px solid #0A1A0F;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; margin-left: -8px;
}
.lp-avatars .lp-avatar:first-child { margin-left: 0; }

/* Proof bar */
.lp-proof {
  background: #0F2817; border-top: 1px solid rgba(22,163,74,0.12);
  border-bottom: 1px solid rgba(22,163,74,0.12); padding: 14px 0;
  text-align: center; color: rgba(255,255,255,0.42); font-size: 13px;
  letter-spacing: 0.04em; font-family: var(--font-inter);
}

/* Pillars */
.lp-pillars { background: #0A1A0F; padding: 96px 0; }
.lp-section-eyebrow {
  font-family: var(--font-inter); font-size: 11px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: #16A34A;
  margin-bottom: 12px; text-align: center;
}
.lp-pillars-title {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700;
  font-size: clamp(24px, 3vw, 38px); color: #fff; letter-spacing: -0.02em;
  text-align: center; margin-bottom: 56px;
}
.lp-pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.lp-pillar {
  background: rgba(22,163,74,0.05); border: 1px solid rgba(22,163,74,0.12);
  border-radius: 20px; padding: 36px 32px; text-align: center;
  transition: border-color 0.2s, background 0.2s;
}
.lp-pillar:hover { background: rgba(22,163,74,0.09); border-color: rgba(22,163,74,0.22); }
.lp-pillar-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba(22,163,74,0.12); border: 1px solid rgba(22,163,74,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.lp-pillar-icon-wrap svg { width: 26px; height: 26px; stroke: #16A34A; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.lp-pillar h3 {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700;
  font-size: 20px; letter-spacing: -0.01em; color: #fff; margin-bottom: 10px;
}
.lp-pillar p { color: rgba(255,255,255,0.52); font-size: 14.5px; line-height: 1.65; font-family: var(--font-inter); }

/* Features */
.lp-features { background: #fff; padding: 96px 0; }
.lp-feature {
  display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center;
  padding: 72px 0; border-bottom: 1px solid #F3F4F6;
}
.lp-feature:last-child { border-bottom: none; }
.lp-feature-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #16A34A; margin-bottom: 12px; font-family: var(--font-inter);
}
.lp-feature-text h2 {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700;
  font-size: clamp(24px, 2.5vw, 36px); color: #0A1A0F; line-height: 1.1;
  letter-spacing: -0.02em; margin-bottom: 18px; text-wrap: balance;
}
.lp-feature-text p { color: #4B5563; font-size: 15px; line-height: 1.75; font-family: var(--font-inter); }

/* Mockup */
.lp-mockup {
  background: #fff; border-radius: 16px; border: 1px solid #E5E7EB;
  box-shadow: 0 12px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
}
.lp-mockup-header {
  display: flex; align-items: center; gap: 6px; padding: 11px 14px;
  background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
}
.lp-mockup-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.lp-mockup-dot.r { background: #EF4444; }
.lp-mockup-dot.y { background: #F59E0B; }
.lp-mockup-dot.g { background: #10B981; }
.lp-mockup-row { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-bottom: 1px solid #F9FAFB; }
.lp-mockup-row:last-child { border-bottom: none; }
.lp-mockup-avatar {
  width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center;
  justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;
}

/* Pricing */
.lp-pricing { background: #0A1A0F; padding: 96px 0; }
.lp-founding-banner {
  background: linear-gradient(90deg, rgba(202,138,4,0.15), rgba(202,138,4,0.08));
  border: 1px solid rgba(202,138,4,0.3);
  color: #FCD34D; font-weight: 600; font-size: 14px;
  text-align: center; padding: 14px 24px; border-radius: 12px; margin-bottom: 56px;
  font-family: var(--font-inter);
}
.lp-section-title {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700;
  font-size: clamp(26px, 3vw, 42px); letter-spacing: -0.02em;
}
.lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.lp-plan {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px; padding: 36px; display: flex; flex-direction: column; position: relative;
}
.lp-plan-popular { background: #0F2817; border-color: #16A34A; }
.lp-popular-badge {
  position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
  background: #16A34A; color: #fff; font-size: 11px; font-weight: 700;
  padding: 4px 16px; border-radius: 99px; white-space: nowrap;
  font-family: var(--font-inter);
}
.lp-plan-label {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700; font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase; color: #86EFAC; margin-bottom: 10px;
}
.lp-plan-price {
  font-family: var(--font-syne), Syne, sans-serif; font-weight: 700; font-size: 48px;
  letter-spacing: -0.03em; color: #fff; line-height: 1; margin-bottom: 6px;
}
.lp-plan-price span { font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.4); font-family: var(--font-inter); }
.lp-plan-desc { color: rgba(255,255,255,0.48); font-size: 14px; line-height: 1.6; margin-bottom: 28px; font-family: var(--font-inter); }
.lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 11px; flex: 1; margin-bottom: 32px; }
.lp-plan-features li { display: flex; align-items: flex-start; gap: 9px; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.45; font-family: var(--font-inter); }
.lp-check { color: #16A34A; font-weight: 700; flex-shrink: 0; }
.lp-btn-outline-plan {
  border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.75); padding: 12px 20px;
  border-radius: 10px; font-size: 14px; font-weight: 600; display: block;
  text-align: center; transition: all 0.18s; margin-top: auto; font-family: var(--font-inter);
}
.lp-btn-outline-plan:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.06); color: #fff; }
.lp-btn-primary-block {
  background: #16A34A; color: #fff; padding: 12px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 600; display: block; text-align: center;
  transition: all 0.18s; margin-top: auto; font-family: var(--font-inter);
  box-shadow: 0 2px 8px rgba(22,163,74,0.3);
}
.lp-btn-primary-block:hover { background: #15803D; }

/* CTA 2 */
.lp-cta2 { background: #0F2817; padding: 100px 0; }

/* Footer */
.lp-footer { background: #050D07; border-top: 1px solid rgba(255,255,255,0.06); padding: 52px 0 40px; }
.lp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
.lp-footer-brand-name {
  font-family: var(--font-inter), -apple-system, sans-serif; font-weight: 800;
  font-size: 18px; letter-spacing: -0.03em; margin-bottom: 8px;
}
.lp-footer-brand-desc { color: rgba(255,255,255,0.35); font-size: 13px; line-height: 1.6; max-width: 240px; font-family: var(--font-inter); }
.lp-footer-col-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 14px; font-family: var(--font-inter); }
.lp-footer-col-links { display: flex; flex-direction: column; gap: 10px; }
.lp-footer-col-links a { color: rgba(255,255,255,0.5); font-size: 13px; transition: color 0.2s; font-family: var(--font-inter); }
.lp-footer-col-links a:hover { color: #86EFAC; }
.lp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; }
.lp-footer-copy { color: rgba(255,255,255,0.2); font-size: 12px; font-family: var(--font-inter); }

/* Responsive */
@media (max-width: 900px) {
  .lp-pillars-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .lp-pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .lp-feature { grid-template-columns: 1fr; gap: 36px; }
  .lp-feature-visual-right { order: -1; }
  .lp-feature-text-right { order: 1; }
  .lp-footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .lp-hero { padding: 80px 0 72px; min-height: auto; }
  .lp-footer-grid { grid-template-columns: 1fr; }
  .lp-footer-bottom { flex-direction: column; gap: 10px; text-align: center; }
}
`

export default async function HomePage() {
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="lp" style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fff' }}>

        {/* ── ANNOUNCEMENT BAR ─────────────────── */}
        <AnnouncementBar />

        {/* ── NAV ─────────────────────────────── */}
        <MarketingNav />

        {/* ── HERO ────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="lp-badge">✦ Now open to founding members</div>
            <h1 className="lp-headline">The Operating System for Independent Professionals</h1>
            <p className="lp-subheadline">
              Everything in one place: CRM, invoicing, an AI business companion, and a community of serious peers. You keep 97% of what you earn.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/signup" className="lp-btn-primary">Join as a Founding Member</Link>
              <a href="#features" className="lp-link-sec">See how it works</a>
            </div>
            {/* Social proof */}
            <div className="lp-social-proof">
              <div className="lp-avatars">
                {[{ bg: '#16A34A', l: 'M' }, { bg: '#0EA5E9', l: 'J' }, { bg: '#6366F1', l: 'S' }].map((a, i) => (
                  <div key={i} className="lp-avatar" style={{ background: a.bg, color: '#fff' }}>{a.l}</div>
                ))}
              </div>
              <span style={{ marginLeft: 10, color: 'rgba(255,255,255,0.42)', fontSize: 13 }}>
                Join 2,400+ independent professionals already on GuildWire
              </span>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ────────────────────── */}
        <div className="lp-proof">
          <div className="lp-container">
            CRM &nbsp;·&nbsp; Invoicing &nbsp;·&nbsp; AI Companion &nbsp;·&nbsp; Community &nbsp;·&nbsp; Tax Tools &nbsp;·&nbsp; Job Board &nbsp;·&nbsp; Education
          </div>
        </div>

        {/* ── THREE PILLARS ───────────────────── */}
        <section className="lp-pillars">
          <div className="lp-container">
            <div className="lp-section-eyebrow">Why GuildWire</div>
            <h2 className="lp-pillars-title">Built for the way you actually work</h2>
            <div className="lp-pillars-grid">
              <div className="lp-pillar">
                <div className="lp-pillar-icon-wrap">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 0 1 3-3m0 6a3 3 0 0 1-3-3"/></svg>
                </div>
                <h3>Keep 97%</h3>
                <p>Stop giving 20% to platforms that don&apos;t work for you. GuildWire charges a flat 3% — nothing else.</p>
              </div>
              <div className="lp-pillar">
                <div className="lp-pillar-icon-wrap">
                  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                </div>
                <h3>One Platform</h3>
                <p>CRM, invoicing, AI companion, and community. All in one place, all working together. Finally.</p>
              </div>
              <div className="lp-pillar">
                <div className="lp-pillar-icon-wrap">
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3>Real Community</h3>
                <p>A guild of serious independent professionals who actually get what it means to build on your own terms.</p>
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
                    <div key={i} className="lp-mockup-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < 3 ? '1px solid #F9FAFB' : 'none' }}>
                      <div className="lp-mockup-avatar" style={{ background: cl.c + '18', color: cl.c }}>{cl.name[0]}</div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111827', fontFamily: 'var(--font-inter)' }}>{cl.name}</span>
                      <span style={{ fontSize: 11, color: cl.c, background: cl.c + '14', padding: '3px 9px', borderRadius: 6, fontWeight: 600, fontFamily: 'var(--font-inter)' }}>{cl.stage}</span>
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
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-inter)' }}>Invoice #0042</span>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>BILL TO</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-inter)' }}>Apex Creative</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3, fontWeight: 600, letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>DUE DATE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-inter)' }}>Jul 15, 2026</div>
                      </div>
                    </div>
                    {[
                      { desc: 'Brand strategy', amt: '$3,200' },
                      { desc: 'Website copy', amt: '$1,800' },
                      { desc: 'Consulting (8h)', amt: '$1,600' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontFamily: 'var(--font-inter)' }}>
                        <span style={{ color: '#374151' }}>{item.desc}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{item.amt}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid #0A1A0F' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', fontFamily: 'var(--font-inter)' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: '#16A34A', fontFamily: 'var(--font-syne), Syne, sans-serif' }}>$6,600</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-feature-text lp-feature-text-right">
                <div className="lp-feature-eyebrow">Invoicing</div>
                <h2>Get paid. Keep what you earn.</h2>
                <p>Create professional invoices in seconds and send them directly from GuildWire. Track payments, send reminders, and keep 97% of every dollar — no platform skimming 20% off the top.</p>
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
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-inter)' }}>AI Companion</span>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ alignSelf: 'flex-end', background: '#0A1A0F', color: '#86EFAC', padding: '9px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.45, fontFamily: 'var(--font-inter)' }}>
                      How much did I earn last month?
                    </div>
                    <div style={{ alignSelf: 'flex-start', background: '#F8FAFC', border: '1px solid #F3F4F6', color: '#374151', padding: '9px 13px', borderRadius: '3px 12px 12px 12px', fontSize: 13, maxWidth: '90%', lineHeight: 1.55, fontFamily: 'var(--font-inter)' }}>
                      Last month you earned <strong style={{ color: '#111827' }}>$14,800</strong> across 6 clients — up 13% from June. Apex Creative was your top client at $4,200.
                    </div>
                    <div style={{ alignSelf: 'flex-end', background: '#0A1A0F', color: '#86EFAC', padding: '9px 13px', borderRadius: '12px 12px 3px 12px', fontSize: 13, maxWidth: '82%', lineHeight: 1.45, fontFamily: 'var(--font-inter)' }}>
                      Draft a follow-up for Foundry Labs
                    </div>
                    <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingLeft: 4, fontFamily: 'var(--font-inter)' }}>
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
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8, fontFamily: 'var(--font-inter)' }}>Community</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Maya R.', tag: 'Designer', text: 'Finally landed a $15k brand project through a referral here. The guild delivers.', likes: 42 },
                      { name: 'James T.', tag: 'Strategist', text: "Hot take: charging by the hour is self-sabotage. Here's why value pricing wins.", likes: 89 },
                    ].map((post, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', fontSize: 13, border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16A34A18', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, fontFamily: 'var(--font-inter)' }}>
                            {post.name[0]}
                          </div>
                          <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'var(--font-inter)' }}>{post.name}</span>
                          <span style={{ fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontFamily: 'var(--font-inter)' }}>{post.tag}</span>
                        </div>
                        <p style={{ color: '#374151', lineHeight: 1.55, marginBottom: 8, fontFamily: 'var(--font-inter)' }}>{post.text}</p>
                        <div style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'var(--font-inter)' }}>❤ {post.likes} likes</div>
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
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="lp-section-eyebrow" style={{ textAlign: 'center' }}>Pricing</div>
              <h2 className="lp-section-title" style={{ color: '#fff' }}>Simple, honest pricing</h2>
              <p style={{ color: 'rgba(134,239,172,0.75)', fontSize: 15, marginTop: 12, fontFamily: 'var(--font-inter)' }}>Plus a 3% transaction fee on invoices — that&apos;s it. No hidden charges.</p>
            </div>
            <div className="lp-pricing-grid">
              {[
                {
                  name: 'Starter', price: '$50', popular: false,
                  desc: 'Everything you need to get started as an independent.',
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
            <div className="lp-section-eyebrow">Get started today</div>
            <h2 className="lp-section-title" style={{ color: '#fff', marginBottom: 16 }}>Ready to keep what you earn?</h2>
            <p style={{ color: 'rgba(134,239,172,0.75)', fontSize: 16, marginBottom: 36, lineHeight: 1.65, maxWidth: 480, margin: '0 auto 36px', fontFamily: 'var(--font-inter)' }}>
              Join the founding guild. 30 days free, no credit card required. Lock in your founding member discount.
            </p>
            <Link href="/signup" className="lp-btn-primary lp-btn-large">Claim your founding member spot</Link>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <div className="lp-footer-brand-name">
                  <span style={{ color: '#ffffff' }}>Guild</span>
                  <span style={{ color: '#16A34A' }}>Wire</span>
                </div>
                <p className="lp-footer-brand-desc">The operating system for independent professionals. Keep 97% of what you earn.</p>
              </div>
              <div>
                <div className="lp-footer-col-title">Product</div>
                <div className="lp-footer-col-links">
                  <a href="#features">Features</a>
                  <a href="#pricing">Pricing</a>
                  <a href="#community">Community</a>
                  <Link href="/signup">Get started</Link>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Company</div>
                <div className="lp-footer-col-links">
                  <a href="#">About</a>
                  <a href="#">Blog</a>
                  <a href="#">Careers</a>
                  <a href="#">Contact</a>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Legal</div>
                <div className="lp-footer-col-links">
                  <a href="#">Privacy</a>
                  <a href="#">Terms</a>
                  <a href="#">Security</a>
                  <a href="#">Cookies</a>
                </div>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <p className="lp-footer-copy">© 2026 GuildWire. All rights reserved.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'var(--font-inter)' }}>Privacy</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'var(--font-inter)' }}>Terms</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
