'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Bot, User, Sparkles, FileText, DollarSign, Users, Calculator, Mic, Paperclip, Copy, ThumbsUp, ThumbsDown, ChevronRight, Code, Globe, NotebookPen, Zap } from 'lucide-react'

interface Action {
  name: string
  summary: string
  data?: Record<string, unknown>
}

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: Action[]
}

const suggestions = [
  { icon: FileText,     label: 'Add a task',          prompt: 'Add a high-priority task: finish the dashboard mockups by Friday for Tech Trophey.' },
  { icon: DollarSign,  label: 'Draft an invoice',    prompt: 'Draft an invoice for Hencewood Digital for $4,500 — API integration project, due in 14 days.' },
  { icon: NotebookPen, label: 'Turn notes to tasks',  prompt: 'Read my notes and turn any action items or to-dos into tasks.' },
  { icon: Calculator,  label: 'Schedule a meeting',  prompt: 'Schedule a kickoff call with NovaBuild for tomorrow at 10am.' },
]

const CAPABILITIES = [
  { icon: FileText,     label: 'Create tasks',       color: '#16A34A' },
  { icon: DollarSign,  label: 'Draft invoices',      color: '#10B981' },
  { icon: Users,       label: 'Add clients',         color: '#D97706' },
  { icon: Calculator,  label: 'Schedule events',     color: '#6366F1' },
  { icon: NotebookPen, label: 'Notes → Tasks',       color: '#8B5CF6' },
  { icon: Code,        label: 'Search jobs',         color: '#06B6D4' },
  { icon: Globe,       label: 'Add CRM leads',       color: '#9CA3AF' },
  { icon: Zap,         label: 'Run agents',          color: '#F59E0B' },
]

const ACTION_LABELS: Record<string, string> = {
  create_task: 'Task', draft_invoice: 'Invoice', add_client: 'Client',
  schedule_event: 'Event', search_jobs: 'Jobs', add_crm_contact: 'CRM', navigate_to: 'Nav',
  read_notes: 'Notes', convert_note_to_tasks: 'Notes → Tasks', create_note: 'Note',
}

function AIAssistantInner() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [greetingLoading, setGreetingLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const didAutoSend = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, greetingLoading])

  // Fetch time-aware greeting on mount — skip if ?q= is present (auto-send handles that case)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) return
    setGreetingLoading(true)
    fetch('/api/ai/greeting')
      .then(r => r.json())
      .then(({ text }: { text: string }) => {
        const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setMessages([{ id: Date.now(), role: 'assistant', content: text, timestamp: ts }])
      })
      .catch(() => {
        const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setMessages([{ id: Date.now(), role: 'assistant', content: "Good to see you — what would you like to tackle today?", timestamp: ts }])
      })
      .finally(() => setGreetingLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSend.current) {
      didAutoSend.current = true
      setTimeout(() => send(q), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    setInterimText('')
  }

  const startVoice = () => {
    if (listening) { stopListening(); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Chrome, Edge, or Safari.'); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
    recognitionRef.current = rec
    setListening(true); setInterimText('')

    rec.onresult = (e: Event & { results: SpeechRecognitionResultList }) => {
      let interim = '', final = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setInterimText(interim)
      if (final.trim()) { setInput(final.trim()); setInterimText('') }
    }

    rec.onend = () => {
      setListening(false); setInterimText(''); recognitionRef.current = null
      setInput(prev => { if (prev.trim()) setTimeout(() => send(prev.trim()), 100); return prev })
    }
    rec.onerror = () => { setListening(false); setInterimText(''); recognitionRef.current = null }
    rec.start()
  }

  const send = async (content?: string) => {
    const text = content || input.trim()
    if (!text || thinking) return
    stopListening()
    const userMsg: Message = {
      id: Date.now(), role: 'user', content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setThinking(true)
    const assistantId = Date.now() + 1
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setThinking(false)
      setMessages(p => [...p, { id: assistantId, role: 'assistant', content: data.text, timestamp: ts, actions: data.actions }])
      const navAction = (data.actions?.filter((a: Action) => a.name === 'navigate_to') ?? []).at(-1)
      if (navAction?.data?.url) setTimeout(() => { window.location.href = navAction.data!.url as string }, 1500)
    } catch {
      setThinking(false)
      setMessages(p => [...p, { id: assistantId, role: 'assistant', content: 'Sorry, I ran into an issue. Make sure **ANTHROPIC_API_KEY** is set in your Vercel environment variables.', timestamp: ts }])
    }
  }

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <strong key={i} style={{ fontFamily: 'var(--font-body)', color: '#111827', display: 'block', marginTop: i > 0 ? 8 : 0, marginBottom: 3 }}>{line.replace(/\*\*/g, '')}</strong>
      if (line.startsWith('• '))
        return <div key={i} style={{ fontFamily: 'var(--font-body)', paddingLeft: 16, color: '#374151', marginBottom: 3, position: 'relative' }}><span style={{ position: 'absolute', left: 4, color: '#16A34A' }}>•</span>{line.replace('• ', '')}</div>
      if (line === '') return <div key={i} style={{ height: 6 }} />
      return <span key={i} style={{ fontFamily: 'var(--font-body)', color: '#374151', lineHeight: 1.7, display: 'block' }}>{line}</span>
    })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#F8FAFC', overflow: 'hidden' }}>

      {/* Left panel */}
      <div className="ai-cap-panel" style={{
        width: 232, background: 'white', borderRight: '1px solid #F3F4F6',
        display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #14532D, #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>GuildWire AI</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              Powered by Claude
            </div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 8, padding: '0 4px' }}>Capabilities</div>
        {CAPABILITIES.map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', color: '#6B7280', transition: 'all 0.15s' }} className="card-hover">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={12} color={color} />
            </div>
            {label}
          </div>
        ))}

        <div style={{ marginTop: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 8, padding: '0 4px' }}>Recent</div>
        {['Tax optimization 2024', 'NovaBuild proposal', 'Contract template'].map(c => (
          <div key={c} style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRadius: 7, transition: 'all 0.15s' }} className="card-hover">{c}</div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'white', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>General Assistant</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            <Sparkles size={13} /> AI-powered
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Suggestions shown after greeting, before any user reply */}
          {messages.length === 1 && messages[0].role === 'assistant' && !thinking && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 600, margin: '0 auto 12px', width: '100%' }}>
              {suggestions.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => send(prompt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '13px 16px', borderRadius: 12,
                    background: 'white', border: '1px solid #F3F4F6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="#16A34A" />
                  </div>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, fontFamily: 'var(--font-body)', flex: 1 }}>{label}</span>
                  <ChevronRight size={13} color="#D1D5DB" />
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', gap: 12,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              maxWidth: '78%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'assistant' ? 'linear-gradient(135deg, #14532D, #16A34A)' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'assistant' ? <Bot size={15} color="#fff" /> : <User size={14} color="#6B7280" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {msg.actions.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '2px 6px', borderRadius: 5, fontFamily: 'var(--font-body)', flexShrink: 0 }}>{ACTION_LABELS[a.name] ?? 'AI'}</span>
                        <span style={{ color: '#15803D', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{a.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{
                  padding: '13px 17px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? '#16A34A' : 'white',
                  border: msg.role === 'user' ? 'none' : '1px solid #F3F4F6',
                  boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.role === 'user'
                    ? <span style={{ color: '#fff', fontFamily: 'var(--font-body)' }}>{msg.content}</span>
                    : <div>{formatContent(msg.content)}</div>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <>
                      {[{ icon: Copy, label: 'Copy' }, { icon: ThumbsUp, label: 'Good' }, { icon: ThumbsDown, label: 'Bad' }].map(({ icon: Icon, label }) => (
                        <button key={label} title={label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
                          <Icon size={11} />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(thinking || greetingLoading) && (
            <div style={{ display: 'flex', gap: 12, maxWidth: '78%' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #14532D, #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} color="#fff" />
              </div>
              <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} className={`dot-${i + 1}`} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 32px 20px', borderTop: '1px solid #F3F4F6', background: 'white', flexShrink: 0 }}>
          {listening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, fontFamily: 'var(--font-body)', flex: 1 }}>
                {interimText || 'Listening… speak your command'}
              </span>
              <button onClick={stopListening} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Cancel</button>
            </div>
          )}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: '#F8FAFC', border: `1.5px solid ${listening ? '#FCA5A5' : '#E5E7EB'}`,
            borderRadius: 14, padding: '10px 14px', transition: 'border-color 0.15s',
          }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', marginBottom: 2, padding: 2 }}><Paperclip size={16} /></button>
            <textarea
              value={listening && interimText ? interimText : input}
              onChange={e => { if (!listening) setInput(e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything or give a voice command…"
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', color: listening ? '#9CA3AF' : '#111827',
                fontSize: 14, resize: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={startVoice}
                title={listening ? 'Stop listening' : 'Voice command'}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: listening ? '#EF4444' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: listening ? '#fff' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.12)' : 'none',
                  transition: 'all 0.15s',
                }}
              ><Mic size={15} /></button>
              <button
                onClick={() => send()}
                disabled={(!input.trim() && !interimText) || thinking}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: (input.trim() || interimText) && !thinking ? '#16A34A' : '#F3F4F6',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              ><Send size={14} color={(input.trim() || interimText) && !thinking ? '#fff' : '#9CA3AF'} /></button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
            AI can make mistakes. Verify important financial and legal information.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIAssistantPage() {
  return (
    <Suspense>
      <AIAssistantInner />
    </Suspense>
  )
}
