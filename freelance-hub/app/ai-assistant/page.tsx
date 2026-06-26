'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  DollarSign,
  Users,
  Calculator,
  BookOpen,
  Zap,
  Mic,
  Paperclip,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ChevronRight,
  Globe,
  Code,
  PenTool,
} from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: string[]
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'assistant',
    content: "Hi! I'm your FreelanceOS AI assistant. I can help you with invoicing, client management, tax planning, proposals, contracts, and more. What can I help you with today?",
    timestamp: '12:00 PM',
    actions: [],
  },
]

const suggestions = [
  { icon: FileText, label: 'Draft a proposal', prompt: 'Help me write a project proposal for a SaaS dashboard redesign for a fintech company. Budget is $8,000.' },
  { icon: DollarSign, label: 'Calculate my taxes', prompt: 'I earned $96,200 this year as a freelancer in California. What are my estimated self-employment taxes and what deductions should I take?' },
  { icon: Users, label: 'Write a follow-up email', prompt: 'Write a professional follow-up email to a potential client who hasn\'t responded to my proposal in 2 weeks.' },
  { icon: Calculator, label: 'Price a project', prompt: 'Help me price a mobile app design project. It includes 25 screens, a design system, and Figma handoff. Client is a Series A startup.' },
  { icon: BookOpen, label: 'Create a contract', prompt: 'Draft a freelance contract for a web development project. 3-month timeline, $15,000 total, 50% upfront.' },
  { icon: Globe, label: 'Optimize my rates', prompt: 'My current hourly rate is $95. Based on market data for senior UX designers with 6 years of experience, what should I be charging?' },
]

const capabilities = [
  { icon: PenTool, label: 'Write proposals & contracts', color: '#6366f1' },
  { icon: DollarSign, label: 'Invoicing & financial analysis', color: '#10b981' },
  { icon: Users, label: 'Client emails & follow-ups', color: '#8b5cf6' },
  { icon: Calculator, label: 'Tax planning & optimization', color: '#f59e0b' },
  { icon: Code, label: 'Code review & tech consulting', color: '#06b6d4' },
  { icon: Globe, label: 'Market research & pricing', color: '#ec4899' },
]

const sampleResponses: Record<string, string> = {
  proposal: `Here's a professional project proposal for the SaaS dashboard redesign:

---

**Project Proposal: FinTech Analytics Dashboard**

**Executive Summary**
We propose a comprehensive redesign of your SaaS analytics platform to improve user retention and reduce time-to-insight for your finance team clients.

**Scope of Work**
• Discovery & Research (Week 1-2): Stakeholder interviews, user research, competitive analysis
• Information Architecture (Week 2): User flows, sitemap, wireframes
• Visual Design (Week 3-5): Design system, high-fidelity screens (15-20 screens)
• Prototyping & Handoff (Week 6): Interactive prototype, Figma developer handoff

**Investment: $8,000**
• 50% ($4,000) upon project kickoff
• 50% ($4,000) upon final delivery

**Timeline: 6 weeks**

Ready to discuss further? I can adjust scope or timeline based on your priorities.`,

  tax: `Based on your $96,200 freelance income in California, here's your estimated tax breakdown:

**Federal Self-Employment Tax: ~$13,600** (15.3% on 92.35% of income)

**Federal Income Tax (approx.): ~$17,800**
After self-employment deduction (~$6,800), your taxable income is ~$89,400.

**California State Tax: ~$6,200** (at blended ~6.5% rate)

**Total Estimated Tax: ~$37,600**

**Key Deductions to Take:**
1. Home office (dedicated space) — up to $5/sq ft
2. Software & tools — 100% deductible
3. Health insurance premiums — 100% deductible
4. Retirement (SEP-IRA) — up to $23,000 or 25% of net income
5. Business travel & professional development

**Recommendation:** Set aside ~39% of each payment for taxes and make quarterly estimated payments. Max out your SEP-IRA to reduce taxable income significantly.`,
}

function getResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('proposal') || lower.includes('saas') || lower.includes('fintech')) {
    return sampleResponses.proposal
  }
  if (lower.includes('tax') || lower.includes('earned') || lower.includes('deduction')) {
    return sampleResponses.tax
  }
  if (lower.includes('rate') || lower.includes('hourly') || lower.includes('charge')) {
    return `Based on market data for senior UX designers with 6 years of experience:

**Current Rate: $95/hr → Recommended: $130-160/hr**

**Market Benchmarks (2024):**
• Mid-level UX (3-5 yrs): $80-110/hr
• Senior UX (5-8 yrs): $120-165/hr
• Principal/Lead UX (8+ yrs): $160-220/hr

**How to raise rates:**
1. Notify existing clients 30-60 days in advance
2. Grandfather current clients for 1 project cycle
3. Apply new rates to all incoming work immediately
4. Add a value statement — "I've helped clients increase conversion by X%"

**Your value proposition at $140/hr:** You're saving clients 200+ hours of internal design work per project. That's $50k+ in employee cost.`
  }
  return `I can help with that! Here's what I'd recommend:

Based on your question, here are the key considerations for a successful outcome:

1. **Define your scope clearly** — Ambiguity is the #1 cause of scope creep. Document everything.
2. **Set clear milestones** — Break the work into deliverable phases with associated payments.
3. **Protect your time** — Build buffer into your estimates (multiply by 1.3x).
4. **Get it in writing** — Use a contract even for small projects. I can draft one for you.

Would you like me to help you draft a specific document, create a proposal, or calculate project pricing? Just let me know!`
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [selectedConvo] = useState('General Assistant')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (content?: string) => {
    const text = content || input.trim()
    if (!text || isThinking) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    setTimeout(() => {
      const response = getResponse(text)
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsThinking(false)
    }, 1500 + Math.random() * 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} style={{ color: '#f1f5f9', display: 'block', marginTop: i > 0 ? 10 : 0, marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</strong>
      }
      if (line.startsWith('• ')) {
        return <div key={i} style={{ paddingLeft: 16, color: '#94a3b8', marginBottom: 3, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 4, color: '#6366f1' }}>•</span>
          {line.replace('• ', '')}
        </div>
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} style={{ paddingLeft: 20, color: '#94a3b8', marginBottom: 3, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 4, color: '#6366f1' }}>{line.match(/^\d+/)?.[0]}.</span>
          {line.replace(/^\d+\. /, '')}
        </div>
      }
      if (line === '---') {
        return <hr key={i} style={{ border: 'none', borderTop: '1px solid #252545', margin: '10px 0' }} />
      }
      if (line === '') return <div key={i} style={{ height: 6 }} />
      return <span key={i} style={{ color: '#94a3b8', lineHeight: 1.7, display: 'block' }}>{line}</span>
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#07070f', overflow: 'hidden' }}>
      {/* Left panel — capabilities */}
      <div style={{ width: 260, background: '#0a0a18', borderRight: '1px solid #1a1a30', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>FreelanceOS AI</div>
              <div style={{ fontSize: 10, color: '#6366f1' }}>Powered by Claude</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 12px', marginBottom: 16 }}>
          <button style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: '#6366f118', border: '1px solid #6366f130', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} />
            New Conversation
          </button>
        </div>

        <div style={{ padding: '0 12px', flex: 1 }}>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Capabilities</div>
          {capabilities.map(({ icon: Icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, marginBottom: 2, cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }} className="sidebar-item">
              <Icon size={14} color={color} />
              <span style={{ fontSize: 12 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a30' }}>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>Recent Conversations</div>
          {['Tax optimization 2024', 'Client proposal — NovaBuild', 'Contract template'].map((conv) => (
            <div key={conv} style={{ fontSize: 11, color: '#64748b', padding: '5px 0', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="sidebar-item">
              {conv}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a1a30', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a18', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="animate-pulse-glow" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{selectedConvo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#6366f1" />
            <span style={{ fontSize: 12, color: '#6366f1' }}>AI-powered</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Suggestions (only show if 1 message) */}
          {messages.length === 1 && (
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, textAlign: 'center' }}>
                Try asking about...
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 700, margin: '0 auto 20px' }}>
                {suggestions.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 10,
                      background: '#0e0e1c', border: '1px solid #1a1a30',
                      color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                    className="card-hover"
                  >
                    <Icon size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                    {label}
                    <ChevronRight size={12} color="#475569" style={{ marginLeft: 'auto' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 12,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                maxWidth: msg.role === 'user' ? '75%' : '85%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'assistant' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#141428',
                  border: msg.role === 'user' ? '1px solid #252545' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {msg.role === 'assistant' ? <Bot size={16} color="white" /> : <User size={15} color="#94a3b8" />}
              </div>

              <div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: msg.role === 'user' ? '#6366f1' : '#0e0e1c',
                    border: msg.role === 'user' ? 'none' : '1px solid #1a1a30',
                    fontSize: 13,
                    lineHeight: 1.6,
                    boxShadow: msg.role === 'user' ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  {msg.role === 'user' ? (
                    <span style={{ color: '#fff' }}>{msg.content}</span>
                  ) : (
                    <div>{formatContent(msg.content)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, borderRadius: 4 }} title="Copy">
                        <Copy size={11} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, borderRadius: 4 }} title="Helpful">
                        <ThumbsUp size={11} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, borderRadius: 4 }} title="Not helpful">
                        <ThumbsDown size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div style={{ display: 'flex', gap: 12, maxWidth: '85%' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ padding: '14px 18px', borderRadius: '4px 12px 12px 12px', background: '#0e0e1c', border: '1px solid #1a1a30', display: 'flex', alignItems: 'center', gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }} className={`dot-${i + 1}`} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #1a1a30', background: '#0a0a18', flexShrink: 0 }}>
          <div style={{ background: '#0e0e1c', border: '1px solid #252545', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-end', boxShadow: '0 0 20px rgba(99,102,241,0.06)' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px 0', marginBottom: 2 }}>
              <Paperclip size={16} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your freelance business..."
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: '#f1f5f9',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
              }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                <Mic size={16} />
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isThinking}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: input.trim() && !isThinking ? '#6366f1' : '#1a1a30',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  boxShadow: input.trim() ? '0 0 10px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <Send size={14} color={input.trim() && !isThinking ? '#fff' : '#475569'} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>FreelanceOS AI can make mistakes. Verify important financial and legal information.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
