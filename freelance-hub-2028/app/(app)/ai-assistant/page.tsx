'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Send, Bot, User, Sparkles, FileText, DollarSign, Users, Calculator,
  Mic, Paperclip, Copy, ThumbsUp, ThumbsDown, ChevronRight, Code, Globe,
  NotebookPen, Zap, ChevronDown, ChevronUp, HelpCircle, X,
} from 'lucide-react'
import SuggestionCard, { type AgentSuggestion } from '../agents/SuggestionCard'

// ── Types ──────────────────────────────────────────────────────────────────

interface Action {
  name: string
  summary: string
  confidence?: 'high' | 'medium' | 'low'
  data?: Record<string, unknown>
}

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: Action[]
  fromVoice?: boolean
  pendingAction?: { name: string; input: Record<string, unknown>; interpretation: string }
  needsClarification?: boolean
  suggestion?: AgentSuggestion
}

interface VoiceMsg {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface VoiceSummary {
  duration: string
  exchanges: number
  transcript: VoiceMsg[]
  expanded: boolean
}

type VoicePhase = 'listening' | 'processing' | 'speaking'

// ── Constants ──────────────────────────────────────────────────────────────

const suggestions = [
  { icon: FileText,     label: 'Add a task',          prompt: 'Add a high-priority task: finish the dashboard mockups by Friday for Tech Trophey.' },
  { icon: DollarSign,  label: 'Draft an invoice',    prompt: 'Draft an invoice for Hencewood Digital for $4,500 — API integration project, due in 14 days.' },
  { icon: NotebookPen, label: 'Turn notes to tasks',  prompt: 'Read my notes and turn any action items or to-dos into tasks.' },
  { icon: Calculator,  label: 'Schedule a meeting',  prompt: 'Schedule a kickoff call with NovaBuild for tomorrow at 10am.' },
]

const CAPABILITIES = [
  { icon: FileText,     label: 'Create tasks',       color: 'var(--accent-brand)' },
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
  calculate_late_fee: 'Late Fee',
}

// ── Confidence Badge ───────────────────────────────────────────────────────

function ConfidenceBadge({ confidence, needsClarification }: { confidence?: string; needsClarification?: boolean }) {
  if (needsClarification) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, borderRadius: 12, padding: '0 10px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Needs clarification</span>
      </div>
    )
  }
  if (confidence === 'medium') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, borderRadius: 12, padding: '0 10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CA8A04', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#92400E', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Check my interpretation</span>
      </div>
    )
  }
  if (confidence === 'high') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, borderRadius: 12, padding: '0 10px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-brand)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-brand-hover)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>High confidence</span>
      </div>
    )
  }
  return null
}

// ── Why? Explain Mode ──────────────────────────────────────────────────────

function ActionExplain({ action, originalMessage, onAskFocus }: { action: Action; originalMessage: string; onAskFocus: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  useEffect(() => {
    if (expanded && contentRef.current) setPanelHeight(contentRef.current.scrollHeight)
    else setPanelHeight(0)
  }, [expanded, explanation, loading, error])

  const track = () => {
    fetch('/api/analytics/why-click', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: action.name }),
    }).catch(() => {})
  }

  const toggle = async () => {
    track()
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (explanation || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: action.name, actionSummary: action.summary,
          actionData: action.data ?? {}, originalMessage,
        }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setExplanation(data.explanation)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          marginTop: 6, fontSize: 12, fontFamily: 'var(--font-body)',
          color: hover ? 'var(--accent-brand)' : '#9CA3AF', transition: 'color 0.15s',
        }}
      >
        <HelpCircle size={12} color={hover ? 'var(--accent-brand)' : '#9CA3AF'} />
        Why did you do that?
      </button>

      <div style={{ maxHeight: panelHeight, overflow: 'hidden', transition: 'max-height 200ms ease' }}>
        <div
          ref={contentRef}
          style={{
            background: 'rgba(var(--accent-brand-rgb),0.03)', borderLeft: '3px solid var(--accent-brand)',
            borderRadius: '0 8px 8px 0', padding: '14px 16px', marginTop: 8, marginLeft: 8,
            position: 'relative',
          }}
        >
          <button
            onClick={() => setExpanded(false)}
            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2 }}
          >
            <X size={13} />
          </button>
          <div style={{ paddingRight: 22, fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.75, minHeight: 18 }}>
            {loading ? 'Thinking…' : error ? "Sorry, I couldn't generate an explanation right now." : explanation}
          </div>
          <p
            onClick={onAskFocus}
            style={{ fontSize: 12, fontStyle: 'italic', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 10, marginBottom: 0, cursor: 'pointer' }}
          >
            Questions? Just ask me.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Voice Mode Overlay ─────────────────────────────────────────────────────

interface VoiceOverlayProps {
  existingMessages: Message[]
  onClose: (transcript: VoiceMsg[], duration: string) => void
}

function VoiceModeOverlay({ existingMessages, onClose }: VoiceOverlayProps) {
  const [phase, setPhase] = useState<VoicePhase>('listening')
  const [interimText, setInterimText] = useState('')
  const [transcript, setTranscript] = useState<VoiceMsg[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [visible, setVisible] = useState(false)

  // Refs for values used in async callbacks (avoid stale closures)
  const phaseRef = useRef<VoicePhase>('listening')
  const transcriptRef = useRef<VoiceMsg[]>([])
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<EventTarget & { start(): void; stop(): void } | null>(null)
  const sessionStart = useRef(Date.now())
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const transcriptBottom = useRef<HTMLDivElement>(null)
  // Ref wrappers for the two mutually-recursive functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startListeningFn = useRef<(() => void) | undefined>(undefined)
  const handleSpeechFn = useRef<((text: string) => Promise<void>) | undefined>(undefined)

  const setPhaseR = (p: VoicePhase) => { phaseRef.current = p; setPhase(p) }

  const addMsg = (msg: VoiceMsg): VoiceMsg[] => {
    const next = [...transcriptRef.current, msg]
    transcriptRef.current = next
    setTranscript(next)
    return next
  }

  // ── Voice selection ───────────────────────────────────────────────────────
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices()
    const eng = voices.filter(v => v.lang.startsWith('en'))
    voiceRef.current =
      eng.find(v => /google/i.test(v.name)) ||
      eng.find(v => /microsoft.*natural|zira|david/i.test(v.name)) ||
      eng.find(v => v.name === 'Alex') ||
      eng.find(v => !v.localService) ||
      eng[0] || null
  }

  // ── Speak a single sentence ───────────────────────────────────────────────
  const speakSentence = (text: string): Promise<void> =>
    new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text)
      if (voiceRef.current) u.voice = voiceRef.current
      u.rate = 0.95
      u.pitch = 1.0
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })

  // ── Handle completed user utterance ──────────────────────────────────────
  const handleUserSpeech = async (text: string) => {
    setInterimText('')
    setPhaseR('processing')

    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const current = addMsg({ role: 'user', content: text, timestamp: ts })

    const allMessages = [
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
      ...current.map(m => ({ role: m.role, content: m.content })),
    ]

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, voiceMode: true }),
      })
      if (!res.ok || !res.body) throw new Error('API error')

      setPhaseR('speaking')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buffer = ''
      let fullText = ''

      // Extract and speak sentences progressively as the stream arrives
      const flushSentences = async () => {
        const re = /^(.*?[.!?])(?:\s+|$)/
        let m: RegExpExecArray | null
        while ((m = re.exec(buffer)) !== null) {
          const sentence = m[1].trim()
          buffer = buffer.slice(m[0].length)
          if (sentence) {
            fullText += sentence + ' '
            await speakSentence(sentence)
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += dec.decode(value, { stream: true })
        await flushSentences()
      }
      if (buffer.trim()) {
        fullText += buffer.trim()
        await speakSentence(buffer.trim())
      }

      const aiTs = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      addMsg({ role: 'assistant', content: fullText.trim(), timestamp: aiTs })

      if (phaseRef.current === 'speaking') startListeningFn.current?.()
    } catch {
      if (phaseRef.current !== 'listening') startListeningFn.current?.()
    }
  }

  // ── Start continuous recognition ──────────────────────────────────────────
  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    setPhaseR('listening')
    setInterimText('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let allFinal = '', lastInterim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) allFinal += e.results[i][0].transcript
        else lastInterim += e.results[i][0].transcript
      }
      const full = allFinal + lastInterim
      setInterimText(full)

      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      if (full.trim()) {
        silenceTimer.current = setTimeout(() => {
          if (phaseRef.current !== 'listening') return
          const t = full.trim()
          rec.stop()
          recognitionRef.current = null
          handleSpeechFn.current?.(t)
        }, 500)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') return
      if (phaseRef.current === 'listening') setTimeout(() => startListeningFn.current?.(), 1200)
    }

    try { rec.start() } catch { /* ignore if already started */ }
  }

  // Keep refs in sync with latest function definitions
  startListeningFn.current = startListening
  handleSpeechFn.current = handleUserSpeech

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    startListeningFn.current?.()

    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis.cancel()
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    transcriptBottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // ── End session ───────────────────────────────────────────────────────────
  const handleEnd = () => {
    recognitionRef.current?.stop()
    window.speechSynthesis.cancel()
    if (silenceTimer.current) clearTimeout(silenceTimer.current)

    const ms = Date.now() - sessionStart.current
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const duration = m > 0 ? `${m}m ${s % 60}s` : `${s}s`

    setVisible(false)
    setTimeout(() => onClose(transcriptRef.current, duration), 300)
  }

  // ── Circle config ─────────────────────────────────────────────────────────
  const circle = {
    listening:  { bg: 'var(--accent-brand)', anim: 'gwVoiceSlow 1.5s ease-in-out infinite', glow: 'rgba(var(--accent-brand-rgb),0.35)' },
    processing: { bg: '#CA8A04', anim: 'gwVoiceFast 0.8s ease-in-out infinite', glow: 'rgba(202,138,4,0.35)' },
    speaking:   { bg: 'var(--accent-brand)', anim: 'none',                                  glow: 'rgba(var(--accent-brand-rgb),0.5)'  },
  }[phase]

  const statusLabel = { listening: 'Listening…', processing: 'Thinking…', speaking: 'Speaking…' }[phase]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0A1A0F',
      display: 'flex', flexDirection: 'column',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <style>{`
        @keyframes gwVoiceSlow {
          0%,100% { transform: scale(1.0); }
          50%      { transform: scale(1.15); }
        }
        @keyframes gwVoiceFast {
          0%,100% { transform: scale(1.0); }
          50%      { transform: scale(1.15); }
        }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(var(--accent-brand-rgb),0.15)', border: '1px solid rgba(var(--accent-brand-rgb),0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={14} color="var(--accent-brand)" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>GuildWire</span>
        </div>

        <button
          onClick={() => setShowTranscript(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.4)', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s' }}
        >
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56, padding: '0 40px', overflow: 'hidden' }}>

        {/* Circle + status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, flexShrink: 0 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: circle.bg,
            animation: circle.anim,
            boxShadow: `0 0 64px ${circle.glow}`,
            willChange: 'transform',
          }} />

          <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'white', fontWeight: 500, letterSpacing: '0.02em' }}>
            {statusLabel}
          </span>

          {interimText && (
            <p style={{
              fontSize: 13, fontFamily: 'var(--font-body)',
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center', maxWidth: 380,
              margin: 0, lineHeight: 1.6,
            }}>
              {interimText}
            </p>
          )}
        </div>

        {/* Live transcript panel */}
        {showTranscript && (
          <div style={{
            width: 300, height: 420, flexShrink: 0,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'auto', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
              Live Transcript
            </div>
            {transcript.length === 0 && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                Speak your first message — it will appear here.
              </p>
            )}
            {transcript.map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: m.role === 'user' ? 'var(--accent-brand)' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', marginBottom: 3 }}>
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                  {m.content}
                </p>
              </div>
            ))}
            <div ref={transcriptBottom} />
          </div>
        )}
      </div>

      {/* ── End session button ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', flexShrink: 0 }}>
        <button
          onClick={handleEnd}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '10px 24px',
            color: 'white', fontSize: 14, fontFamily: 'var(--font-body)',
            cursor: 'pointer', letterSpacing: '0.01em',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
        >
          End voice session
        </button>
      </div>
    </div>
  )
}

// ── Main AI Assistant ──────────────────────────────────────────────────────

function AIAssistantInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dismissingSuggestionId, setDismissingSuggestionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [greetingLoading, setGreetingLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceSummary, setVoiceSummary] = useState<VoiceSummary | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const didAutoSend = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, greetingLoading])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) return
    setGreetingLoading(true)
    fetch('/api/ai/greeting')
      .then(r => r.json())
      .then(({ text, suggestion }: { text: string; suggestion?: AgentSuggestion | null }) => {
        const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        setMessages([{ id: Date.now(), role: 'assistant', content: text, timestamp: ts, suggestion: suggestion ?? undefined }])
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

  const createFromCompanionSuggestion = (suggestion: AgentSuggestion) => {
    router.push(`/agents?openSuggestion=${suggestion.id}`)
  }

  const dismissCompanionSuggestion = async (id: number) => {
    setDismissingSuggestionId(id)
    await fetch(`/api/agent-suggestions/${id}/dismiss`, { method: 'POST' }).catch(() => {})
    setMessages(prev => prev.map(m => m.suggestion?.id === id ? { ...m, suggestion: undefined } : m))
    setDismissingSuggestionId(null)
  }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
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

  const openVoiceMode = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      setMessages(p => [...p, {
        id: Date.now(), role: 'assistant', timestamp: ts,
        content: 'Voice mode requires a modern browser with microphone access. Try Chrome or Edge for the best experience.',
      }])
      return
    }
    stopListening()
    setVoiceActive(true)
  }

  const handleVoiceClose = (transcript: VoiceMsg[], duration: string) => {
    setVoiceActive(false)
    if (transcript.length === 0) return

    const voiceMessages: Message[] = transcript.map((m, i) => ({
      id: Date.now() + i,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      fromVoice: true,
    }))

    setMessages(p => [...p, ...voiceMessages])
    setVoiceSummary({
      duration,
      exchanges: Math.floor(transcript.length / 2),
      transcript,
      expanded: false,
    })

    // Scroll to bottom after voice messages land
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const confirmAction = async (
    pendingAction: { name: string; input: Record<string, unknown>; interpretation: string },
    msgId: number
  ) => {
    if (thinking) return
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = { id: Date.now(), role: 'user', content: 'Yes, do it', timestamp: ts }
    const updatedMessages = messages
      .map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m)
      .concat(userMsg)
    setMessages(updatedMessages)
    setThinking(true)
    const assistantId = Date.now() + 1
    const ts2 = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          confirmPendingAction: { name: pendingAction.name, input: pendingAction.input },
        }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setThinking(false)
      setMessages(p => [...p, {
        id: assistantId, role: 'assistant', content: data.text, timestamp: ts2,
        actions: data.actions, pendingAction: data.pendingAction, needsClarification: data.needsClarification,
      }])
      const navAction = (data.actions?.filter((a: Action) => a.name === 'navigate_to') ?? []).at(-1)
      if (navAction?.data?.url) setTimeout(() => { window.location.href = navAction.data!.url as string }, 1500)
    } catch {
      setThinking(false)
      setMessages(p => [...p, { id: assistantId, role: 'assistant', content: 'Sorry, I ran into an issue processing that action.', timestamp: ts2 }])
    }
  }

  const changeAction = (msgId: number) => {
    setMessages(p => p.map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m))
    inputRef.current?.focus()
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
      setMessages(p => [...p, {
        id: assistantId, role: 'assistant', content: data.text, timestamp: ts,
        actions: data.actions, pendingAction: data.pendingAction, needsClarification: data.needsClarification,
      }])
      const navAction = (data.actions?.filter((a: Action) => a.name === 'navigate_to') ?? []).at(-1)
      if (navAction?.data?.url) setTimeout(() => { window.location.href = navAction.data!.url as string }, 1500)
    } catch {
      setThinking(false)
      setMessages(p => [...p, { id: assistantId, role: 'assistant', content: 'Sorry, I ran into an issue. Make sure **ANTHROPIC_API_KEY** is set in your environment variables.', timestamp: ts }])
    }
  }

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <strong key={i} style={{ fontFamily: 'var(--font-body)', color: '#111827', display: 'block', marginTop: i > 0 ? 8 : 0, marginBottom: 3 }}>{line.replace(/\*\*/g, '')}</strong>
      if (line.startsWith('• '))
        return <div key={i} style={{ fontFamily: 'var(--font-body)', paddingLeft: 16, color: '#374151', marginBottom: 3, position: 'relative' }}><span style={{ position: 'absolute', left: 4, color: 'var(--accent-brand)' }}>•</span>{line.replace('• ', '')}</div>
      if (line === '') return <div key={i} style={{ height: 6 }} />
      return <span key={i} style={{ fontFamily: 'var(--font-body)', color: '#374151', lineHeight: 1.7, display: 'block' }}>{line}</span>
    })

  return (
    <>
      {voiceActive && (
        <VoiceModeOverlay
          existingMessages={messages}
          onClose={handleVoiceClose}
        />
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* Left panel */}
        <div className="ai-cap-panel" style={{
          width: 232, background: 'white', borderRight: '1px solid #F3F4F6',
          display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 4px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-brand-dark), var(--accent-brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>GuildWire AI</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent-brand)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-brand)', display: 'inline-block' }} />
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

          {/* Header */}
          <div style={{
            padding: '16px 28px', borderBottom: '1px solid #F3F4F6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'white', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827' }}>General Assistant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                <Sparkles size={13} /> AI-powered
              </div>
              <button
                onClick={openVoiceMode}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 9,
                  background: 'white', border: '1px solid #E5E7EB',
                  cursor: 'pointer', fontSize: 13,
                  fontFamily: 'var(--font-body)', color: '#374151',
                  fontWeight: 500, transition: 'all 0.15s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-brand)'; e.currentTarget.style.color = 'var(--accent-brand)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
              >
                <Mic size={13} color="var(--accent-brand)" />
                Voice Mode
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Voice session summary card */}
            {voiceSummary && (
              <div style={{
                borderRadius: 12, border: '1px solid #E5E7EB',
                background: 'white', overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                marginBottom: 4, flexShrink: 0,
              }}>
                <button
                  onClick={() => setVoiceSummary(p => p ? { ...p, expanded: !p.expanded } : p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mic size={13} color="var(--accent-brand)" />
                    </div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>
                        Voice session
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginLeft: 8 }}>
                        {voiceSummary.duration} · {voiceSummary.exchanges} exchange{voiceSummary.exchanges !== 1 ? 's' : ''} · Tap to {voiceSummary.expanded ? 'collapse' : 'replay'} transcript
                      </span>
                    </div>
                  </div>
                  {voiceSummary.expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                </button>
                {voiceSummary.expanded && (
                  <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ height: 6 }} />
                    {voiceSummary.transcript.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                          color: m.role === 'user' ? 'var(--accent-brand)' : '#6B7280',
                          fontFamily: 'var(--font-body)', paddingTop: 2, flexShrink: 0, width: 18,
                        }}>
                          {m.role === 'user' ? 'You' : 'AI'}
                        </span>
                        <p style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.55 }}>
                          {m.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestion cards after greeting */}
            {messages.length === 1 && messages[0].role === 'assistant' && !thinking && !voiceSummary && (
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
                      <Icon size={14} color="var(--accent-brand)" />
                    </div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, fontFamily: 'var(--font-body)', flex: 1 }}>{label}</span>
                    <ChevronRight size={13} color="#D1D5DB" />
                  </button>
                ))}
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, msgIdx) => {
            const precedingUserMsg = msg.role === 'assistant'
              ? [...messages.slice(0, msgIdx)].reverse().find(m => m.role === 'user')?.content ?? ''
              : ''
            return (
              <div key={msg.id} style={{
                display: 'flex', gap: 12,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                maxWidth: '78%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'assistant' ? 'linear-gradient(135deg, var(--accent-brand-dark), var(--accent-brand))' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'assistant' ? <Bot size={15} color="#fff" /> : <User size={14} color="#6B7280" />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {msg.actions.map((a, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-brand-hover)', background: '#DCFCE7', padding: '2px 6px', borderRadius: 5, fontFamily: 'var(--font-body)', flexShrink: 0 }}>{ACTION_LABELS[a.name] ?? 'AI'}</span>
                            <span style={{ color: 'var(--accent-brand-hover)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{a.summary}</span>
                          </div>
                          <ActionExplain action={a} originalMessage={precedingUserMsg} onAskFocus={() => inputRef.current?.focus()} />
                        </div>
                      ))}
                      <ConfidenceBadge confidence="high" />
                    </div>
                  )}
                  <div style={{
                    padding: '13px 17px',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'var(--accent-brand)' : 'white',
                    border: msg.role === 'user' ? 'none' : '1px solid #F3F4F6',
                    boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                    fontSize: 14, lineHeight: 1.6,
                  }}>
                    {msg.role === 'user'
                      ? <span style={{ color: '#fff', fontFamily: 'var(--font-body)' }}>{msg.content}</span>
                      : <div>{formatContent(msg.content)}</div>
                    }
                  </div>
                  {msg.suggestion && msg.role === 'assistant' && (
                    <div style={{ minWidth: 340 }}>
                      <SuggestionCard
                        suggestion={msg.suggestion}
                        onCreate={createFromCompanionSuggestion}
                        onDismiss={dismissCompanionSuggestion}
                        dismissing={dismissingSuggestionId === msg.suggestion.id}
                      />
                    </div>
                  )}
                  {msg.pendingAction && msg.role === 'assistant' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <ConfidenceBadge confidence="medium" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => confirmAction(msg.pendingAction!, msg.id)}
                          disabled={thinking}
                          style={{ background: thinking ? '#86EFAC' : 'var(--accent-brand)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: thinking ? 'default' : 'pointer', transition: 'background 0.15s' }}
                        >
                          Yes, do it
                        </button>
                        <button
                          onClick={() => changeAction(msg.id)}
                          disabled={thinking}
                          style={{ background: 'transparent', border: '1px solid #D1D5DB', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: thinking ? 'default' : 'pointer' }}
                        >
                          Change something
                        </button>
                      </div>
                    </div>
                  )}
                  {msg.needsClarification && msg.role === 'assistant' && (
                    <ConfidenceBadge needsClarification={true} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
                    {msg.fromVoice && (
                      <Mic size={10} color="var(--accent-brand)" />
                    )}
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
            )})}

            {(thinking || greetingLoading) && (
              <div style={{ display: 'flex', gap: 12, maxWidth: '78%' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-brand-dark), var(--accent-brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={15} color="#fff" />
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-brand)' }} className={`dot-${i + 1}`} />
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
                ref={inputRef}
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
                    background: (input.trim() || interimText) && !thinking ? 'var(--accent-brand)' : '#F3F4F6',
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
    </>
  )
}

export default function AIAssistantPage() {
  return (
    <Suspense>
      <AIAssistantInner />
    </Suspense>
  )
}
