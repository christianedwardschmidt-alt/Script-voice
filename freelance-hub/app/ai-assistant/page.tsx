'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, FileText, DollarSign, Users, Calculator, BookOpen, Mic, Paperclip, Copy, ThumbsUp, ThumbsDown, ChevronRight, PenTool, Globe, Code } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const suggestions = [
  { icon: FileText, label: 'Draft a proposal', prompt: 'Help me write a project proposal for a SaaS dashboard redesign. Budget is $8,000.' },
  { icon: DollarSign, label: 'Calculate my taxes', prompt: 'I earned $96,200 this year as a freelancer. What are my estimated taxes and best deductions?' },
  { icon: Users, label: 'Write a follow-up', prompt: 'Write a professional follow-up email to a client who hasn\'t responded to my proposal in 2 weeks.' },
  { icon: Calculator, label: 'Price a project', prompt: 'Help me price a mobile app design project with 25 screens, a design system, and Figma handoff.' },
]

function getResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('proposal') || lower.includes('saas')) {
    return `Here's a professional proposal outline:\n\n**Project Proposal: SaaS Dashboard Redesign**\n\n**Scope of Work**\n• Discovery & Research (Week 1–2)\n• Information Architecture & Wireframes (Week 3)\n• High-Fidelity Design — 15–20 screens (Week 4–6)\n• Prototype, Handoff & Documentation (Week 7–8)\n\n**Investment: $8,000**\n• 50% ($4,000) on kickoff\n• 50% ($4,000) on final delivery\n\n**Timeline: 8 weeks**\n\nWant me to write the full version as a Word doc or PDF?`
  }
  if (lower.includes('tax') || lower.includes('deduction')) {
    return `Based on $96,200 freelance income, here's your estimate:\n\n**Self-Employment Tax: ~$13,600** (15.3%)\n**Federal Income Tax: ~$17,200**\n**Total Estimated: ~$30,800**\n\n**Top Deductions to Take:**\n• Home office — up to $5/sq ft\n• Software & tools — 100% deductible\n• Health insurance — 100% deductible\n• SEP-IRA contributions — up to $23,000\n• Education & courses — deductible\n\nTip: Max your SEP-IRA to cut ~$7,000 from your taxable income.`
  }
  if (lower.includes('follow-up') || lower.includes('email')) {
    return `Here's a follow-up email template:\n\n**Subject:** Following up — [Project Name] Proposal\n\nHi [Name],\n\nI wanted to follow up on the proposal I sent over on [date]. I'm excited about the possibility of working together on [project].\n\nDo you have any questions about the scope or timeline? I'm happy to jump on a quick call to discuss.\n\nLooking forward to hearing from you!\n\nBest,\n[Your name]`
  }
  if (lower.includes('price') || lower.includes('mobile') || lower.includes('design')) {
    return `For a mobile app design project with 25 screens + design system + Figma handoff:\n\n**Recommended Pricing: $12,000–$18,000**\n\nBreakdown:\n• 25 screens × $320–400/screen = $8,000–10,000\n• Design system (components, tokens, docs) = $2,500–4,000\n• Figma handoff + developer guide = $1,500–4,000\n\n**For a Series A startup:** Price at $15,000–18,000. They have budget and value quality. Don't under-price to win — it signals risk.`
  }
  return `Great question! Here's what I'd recommend:\n\n• Start by defining your goals clearly — specificity leads to better outcomes\n• Set a realistic timeline with buffer (multiply estimates by 1.3x)\n• Document everything in writing before starting work\n• Price based on value delivered, not hours spent\n\nWant me to help you draft a specific document, calculate pricing, or prepare for a client call?`
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: "Hi! I'm your LanceFlo AI assistant. I can help with proposals, tax planning, client emails, project pricing, and more. What can I help you with today?", timestamp: '12:00 PM' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = (content?: string) => {
    const text = content || input.trim()
    if (!text || thinking) return
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(p => [...p, userMsg])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now() + 1, role: 'assistant', content: getResponse(text), timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }])
      setThinking(false)
    }, 1200 + Math.random() * 800)
  }

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} style={{ color: 'var(--text)', display: 'block', marginTop: i > 0 ? 8 : 0, marginBottom: 3 }}>{line.replace(/\*\*/g, '')}</strong>
      if (line.startsWith('• ')) return <div key={i} style={{ paddingLeft: 16, color: 'var(--text)', marginBottom: 2, position: 'relative' }}><span style={{ position: 'absolute', left: 4, color: '#7c3aed' }}>•</span>{line.replace('• ', '')}</div>
      if (line === '') return <div key={i} style={{ height: 5 }} />
      return <span key={i} style={{ color: 'var(--text)', lineHeight: 1.7, display: 'block' }}>{line}</span>
    })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Left capabilities panel */}
      <div style={{ width: 240, background: 'var(--card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '0 4px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>LanceFlo AI</div>
            <div style={{ fontSize: 11, color: '#7c3aed' }}>Powered by Claude</div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', marginBottom: 8, padding: '0 4px' }}>Capabilities</div>
        {[
          { icon: PenTool, label: 'Proposals & Contracts', color: '#7c3aed' },
          { icon: DollarSign, label: 'Financial Analysis', color: '#10b981' },
          { icon: Users, label: 'Client Emails', color: '#f59e0b' },
          { icon: Calculator, label: 'Tax Planning', color: '#ec4899' },
          { icon: Code, label: 'Tech Consulting', color: '#06b6d4' },
          { icon: Globe, label: 'Market Research', color: 'var(--text-2)' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, transition: 'all 0.15s' }} className="card-hover">
            <Icon size={14} color={color} />
            {label}
          </div>
        ))}

        <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', marginBottom: 8, padding: '0 4px' }}>Recent</div>
        {['Tax optimization 2024', 'NovaBuild proposal', 'Contract template'].map(c => (
          <div key={c} style={{ fontSize: 12, color: 'var(--text-2)', padding: '5px 8px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRadius: 6 }} className="card-hover">{c}</div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>General Assistant</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
            <Sparkles size={13} /> AI-powered
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 640, margin: '0 auto 10px' }}>
              {suggestions.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => send(prompt)}
                  className="card card-hover"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Icon size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
                  <ChevronRight size={12} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'assistant' ? '#7c3aed' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {msg.role === 'assistant' ? <Bot size={15} color="#fff" /> : <User size={14} color="#6b7280" />}
              </div>
              <div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? '#7c3aed' : '#fff',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.role === 'user'
                    ? <span style={{ color: '#fff' }}>{msg.content}</span>
                    : <div>{formatContent(msg.content)}</div>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <>
                      {[{ icon: Copy, label: 'Copy' }, { icon: ThumbsUp, label: 'Good' }, { icon: ThumbsDown, label: 'Bad' }].map(({ icon: Icon, label }) => (
                        <button key={label} title={label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 2 }}>
                          <Icon size={11} />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ display: 'flex', gap: 10, maxWidth: '80%' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} color="#fff" />
              </div>
              <div style={{ padding: '14px 18px', borderRadius: '4px 14px 14px 14px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed' }} className={`dot-${i + 1}`} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', marginBottom: 2 }}><Paperclip size={16} /></button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything about your freelance business..."
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto' }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}><Mic size={16} /></button>
              <button
                onClick={() => send()}
                disabled={!input.trim() || thinking}
                style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !thinking ? '#7c3aed' : '#e5e7eb', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              >
                <Send size={14} color={input.trim() && !thinking ? '#fff' : '#9ca3af'} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--text-2)' }}>
            AI can make mistakes. Verify important financial and legal information.
          </div>
        </div>
      </div>
    </div>
  )
}
