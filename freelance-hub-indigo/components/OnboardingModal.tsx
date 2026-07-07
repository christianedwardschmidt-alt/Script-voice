'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, FileText, Users, Bot, CheckSquare, ArrowRight, X } from 'lucide-react'

const SPECIALTIES = [
  { label: 'Design & Creative', emoji: '🎨', desc: 'UI/UX, branding, illustration' },
  { label: 'Development',       emoji: '💻', desc: 'Web, mobile, backend' },
  { label: 'Consulting',        emoji: '📊', desc: 'Strategy, ops, marketing' },
  { label: 'Writing & Content', emoji: '✍️',  desc: 'Copy, video, social media' },
]

const FIRST_ACTIONS = [
  { label: 'Create my first invoice', icon: FileText, href: '/invoicing', color: '#d97706' },
  { label: 'Add a client',            icon: Users,    href: '/clients',   color: '#16a34a' },
  { label: 'Plan my tasks',           icon: CheckSquare, href: '/tasks',  color: '#16a34a' },
  { label: 'Ask the AI assistant',    icon: Bot,      href: '/ai-assistant', color: '#0ea5e9' },
]

export default function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const router = useRouter()

  useEffect(() => {
    const done = localStorage.getItem('gw_onboarded')
    if (!done) {
      setTimeout(() => setShow(true), 600)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('gw_onboarded', '1')
    setShow(false)
  }

  function finish(href: string) {
    localStorage.setItem('gw_onboarded', '1')
    if (name) localStorage.setItem('gw_username', name)
    setShow(false)
    router.push(href)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        width: '100%', maxWidth: 480,
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.06)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(15,17,23,0.4)',
          }}
        >
          <X size={14} />
        </button>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#f0f0f0' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg, #15803d, #16a34a)',
            width: `${((step + 1) / 3) * 100}%`, transition: 'width 0.4s ease',
            borderRadius: 99,
          }} />
        </div>

        <div style={{ padding: '32px 36px 36px' }}>

          {/* Step 0: Welcome + name */}
          {step === 0 && (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #15803d, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
              }}>
                <Zap size={24} style={{ color: '#fff' }} />
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(15,17,23,0.3)', marginBottom: 8 }}>WELCOME · STEP 1 OF 3</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: '#0f1117', marginBottom: 8, lineHeight: 1.2 }}>
                Welcome to GuildWire 2028
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.55)', lineHeight: 1.6, marginBottom: 24 }}>
                Your all-in-one freelancer OS. Let's personalize it in 60 seconds.
              </p>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 8 }}>
                What's your first name?
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)}
                placeholder="e.g. Alex"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1.5px solid rgba(0,0,0,0.12)', background: '#fafafa',
                  fontSize: 14, color: '#0f1117', outline: 'none',
                  fontFamily: 'inherit', marginBottom: 20,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.background = '#fafafa' }}
              />
              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  background: name.trim() ? 'linear-gradient(135deg, #15803d, #16a34a)' : 'rgba(0,0,0,0.08)',
                  color: name.trim() ? '#fff' : 'rgba(15,17,23,0.35)',
                  fontSize: 13.5, fontWeight: 700, border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: name.trim() ? '0 4px 14px rgba(22,163,74,0.28)' : 'none',
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}

          {/* Step 1: Specialty */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(15,17,23,0.3)', marginBottom: 8 }}>YOUR WORK · STEP 2 OF 3</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f1117', marginBottom: 6, lineHeight: 1.2 }}>
                Hey {name}! What kind of freelancer are you?
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 20, lineHeight: 1.5 }}>
                We'll tailor your dashboard to what matters most to you.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {SPECIALTIES.map(s => (
                  <button
                    key={s.label}
                    onClick={() => { setSpecialty(s.label); setTimeout(() => setStep(2), 180) }}
                    style={{
                      padding: '14px', borderRadius: 12, textAlign: 'left',
                      border: specialty === s.label ? '2px solid #16a34a' : '1.5px solid rgba(0,0,0,0.1)',
                      background: specialty === s.label ? 'rgba(22,163,74,0.06)' : '#fafafa',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f1117', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(15,17,23,0.45)' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                style={{ background: 'none', border: 'none', color: 'rgba(15,17,23,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
            </>
          )}

          {/* Step 2: First action */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(15,17,23,0.3)', marginBottom: 8 }}>GET STARTED · STEP 3 OF 3</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f1117', marginBottom: 6, lineHeight: 1.2 }}>
                You're all set, {name}! 🎉
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 20, lineHeight: 1.5 }}>
                What would you like to do first?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {FIRST_ACTIONS.map(({ label, icon: Icon, href, color }) => (
                  <button
                    key={label}
                    onClick={() => finish(href)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid rgba(0,0,0,0.09)',
                      background: '#fafafa', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    className="onboard-action-btn"
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: `${color}12`, border: `1px solid ${color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} style={{ color }} strokeWidth={2} />
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f1117' }}>{label}</span>
                    <ArrowRight size={14} style={{ color: 'rgba(15,17,23,0.25)' }} />
                  </button>
                ))}
              </div>
              <button
                onClick={dismiss}
                style={{ background: 'none', border: 'none', color: 'rgba(15,17,23,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'center' }}
              >
                Skip — go to dashboard
              </button>
              <style>{`
                .onboard-action-btn:hover {
                  background: #fff !important;
                  border-color: rgba(0,0,0,0.16) !important;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                  transform: translateY(-1px);
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
