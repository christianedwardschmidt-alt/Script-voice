'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Bot, User, Sparkles, FileText, DollarSign, Users, Calculator, Mic, Paperclip, Copy, ThumbsUp, ThumbsDown, ChevronRight, PenTool, Globe, Code } from 'lucide-react'

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
  { icon: FileText, label: 'Add a task', prompt: 'Add a high-priority task: finish the dashboard mockups by Friday for Tech Trophey.' },
  { icon: DollarSign, label: 'Draft an invoice', prompt: 'Draft an invoice for Hencewood Digital for $4,500 — API integration project, due in 14 days.' },
  { icon: Users, label: 'Find a job', prompt: 'Find me React or Next.js contract jobs in my job board.' },
  { icon: Calculator, label: 'Schedule a meeting', prompt: 'Schedule a kickoff call with NovaBuild for tomorrow at 10am.' },
]

const ACTION_ICONS: Record<string, string> = {
  create_task: '✓',
  draft_invoice: '🧾',
  add_client: '👤',
  schedule_event: '📅',
  search_jobs: '🔍',
  add_crm_contact: '📇',
  navigate_to: '🧭',
}
function actionIcon(name: string) { return ACTION_ICONS[name] ?? '⚡' }

function AIAssistantInner() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: "Hi! I'm your GuildWire AI assistant. I can answer questions AND take real actions in your workspace — try telling me to add a task, draft an invoice, schedule a meeting, search jobs, or add a client. What would you like to do?", timestamp: '12:00 PM' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const didAutoSend = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

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
    if (!SR) {
      alert('Voice input requires Chrome, Edge, or Safari.')
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec
    setListening(true)
    setInterimText('')

    rec.onresult = (e: Event & { results: SpeechRecognitionResultList }) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setInterimText(interim)
      if (final.trim()) {
        setInput(final.trim())
        setInterimText('')
      }
    }

    rec.onend = () => {
      setListening(false)
      setInterimText('')
      recognitionRef.current = null
      // Auto-send if we captured something
      setInput(prev => {
        if (prev.trim()) {
          setTimeout(() => send(prev.trim()), 100)
        }
        return prev
      })
    }

    rec.onerror = () => { setListening(false); setInterimText(''); recognitionRef.current = null }
    rec.start()
  }

  const send = async (content?: string) => {
    const text = content || input.trim()
    if (!text || thinking) return

    stopListening()
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()

      setThinking(false)
      setMessages(p => [
        ...p,
        { id: assistantId, role: 'assistant', content: data.text, timestamp: ts, actions: data.actions },
      ])
      const allNavActions = data.actions?.filter((a: Action) => a.name === 'navigate_to') ?? []
      const navAction = allNavActions[allNavActions.length - 1]
      if (navAction?.data?.url) {
        setTimeout(() => { window.location.href = navAction.data!.url as string }, 1500)
      }
    } catch {
      setThinking(false)
      setMessages(p => [
        ...p,
        {
          id: assistantId,
          role: 'assistant',
          content: 'Sorry, I ran into an issue. Make sure **ANTHROPIC_API_KEY** is set in your Vercel environment variables.',
          timestamp: ts,
        },
      ])
    }
  }

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} style={{ color: '#1c1917', display: 'block', marginTop: i > 0 ? 8 : 0, marginBottom: 3 }}>{line.replace(/\*\*/g, '')}</strong>
      if (line.startsWith('• ')) return <div key={i} style={{ paddingLeft: 16, color: '#1c1917', marginBottom: 2, position: 'relative' }}><span style={{ position: 'absolute', left: 4, color: '#16a34a' }}>•</span>{line.replace('• ', '')}</div>
      if (line === '') return <div key={i} style={{ height: 5 }} />
      return <span key={i} style={{ color: '#1c1917', lineHeight: 1.7, display: 'block' }}>{line}</span>
    })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Left capabilities panel */}
      <div className="ai-cap-panel" style={{ width: 240, background: 'var(--card)', borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '0 4px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917' }}>GuildWire AI</div>
            <div style={{ fontSize: 11, color: '#16a34a' }}>Powered by Claude</div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', marginBottom: 8, padding: '0 4px' }}>Capabilities</div>
        {[
          { icon: FileText, label: 'Create tasks', color: '#16a34a' },
          { icon: DollarSign, label: 'Draft invoices', color: '#10b981' },
          { icon: Users, label: 'Add clients', color: '#f59e0b' },
          { icon: Calculator, label: 'Schedule events', color: '#ec4899' },
          { icon: Code, label: 'Search jobs', color: '#06b6d4' },
          { icon: Globe, label: 'Add CRM leads', color: '#78716c' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', color: '#78716c', fontSize: 13, transition: 'all 0.15s' }} className="card-hover">
            <Icon size={14} color={color} />
            {label}
          </div>
        ))}

        <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', marginBottom: 8, padding: '0 4px' }}>Recent</div>
        {['Tax optimization 2024', 'NovaBuild proposal', 'Contract template'].map(c => (
          <div key={c} style={{ fontSize: 12, color: '#78716c', padding: '5px 8px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRadius: 6 }} className="card-hover">{c}</div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>General Assistant</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Icon size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#1c1917', fontWeight: 500 }}>{label}</span>
                  <ChevronRight size={12} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'assistant' ? '#16a34a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {msg.role === 'assistant' ? <Bot size={15} color="#fff" /> : <User size={14} color="#6b7280" />}
              </div>
              <div>
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {msg.actions.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                        <span style={{ fontSize: 14 }}>{actionIcon(a.name)}</span>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>{a.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? '#16a34a' : '#fff',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.role === 'user'
                    ? <span style={{ color: '#fff' }}>{msg.content}</span>
                    : <div>{formatContent(msg.content)}</div>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: '#78716c' }}>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <>
                      {[{ icon: Copy, label: 'Copy' }, { icon: ThumbsUp, label: 'Good' }, { icon: ThumbsDown, label: 'Bad' }].map(({ icon: Icon, label }) => (
                        <button key={label} title={label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', padding: 2 }}>
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
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} color="#fff" />
              </div>
              <div style={{ padding: '14px 18px', borderRadius: '4px 14px 14px 14px', background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} className={`dot-${i + 1}`} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'var(--card)', flexShrink: 0 }}>
          {listening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                {interimText || 'Listening… speak your command'}
              </span>
              <button onClick={stopListening} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 600 }}>Cancel</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-2)', border: `1px solid ${listening ? '#fca5a5' : 'rgba(0,0,0,0.06)'}`, borderRadius: 12, padding: '10px 12px', transition: 'border-color 0.15s' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', marginBottom: 2 }}><Paperclip size={16} /></button>
            <textarea
              value={listening && interimText ? interimText : input}
              onChange={e => { if (!listening) setInput(e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything or give a voice command — tap 🎤 and speak"
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', color: listening ? '#78716c' : '#1c1917', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto' }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={startVoice}
                title={listening ? 'Stop listening' : 'Voice command'}
                style={{ width: 30, height: 30, borderRadius: '50%', background: listening ? '#ef4444' : 'none', border: listening ? 'none' : 'none', cursor: 'pointer', color: listening ? '#fff' : '#78716c', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none' }}
              >
                <Mic size={16} />
              </button>
              <button
                onClick={() => send()}
                disabled={(!input.trim() && !interimText) || thinking}
                style={{ width: 32, height: 32, borderRadius: 8, background: (input.trim() || interimText) && !thinking ? '#16a34a' : '#e5e7eb', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              >
                <Send size={14} color={(input.trim() || interimText) && !thinking ? '#fff' : '#9ca3af'} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: '#78716c' }}>
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
