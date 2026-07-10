'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Check, X, Ellipsis, ChevronDown, ChevronRight,
  ArrowRight, Play, Pause, RefreshCw, Settings2, Activity,
  Bot, Sparkles, Zap, Mail, Bell, Rocket, Send, RotateCcw,
  ToggleLeft, ToggleRight, Timer, TrendingUp, Star,
  UserPlus, Users, FileText, Award, BarChart2, AlertCircle,
  DollarSign, CheckSquare, Mic, Calendar, Clock, Cpu,
  Shield, Layers, Target, Database, Globe, Link, Search, Edit3,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id: number
  name: string
  icon: string
  description: string
  status: 'active' | 'paused'
  trigger_type: string
  template_id: string
  run_count: number
  last_run: string | null
  created_at: string
}

interface BuilderCondition {
  id: string
  type: string
  value: string
  value2?: string
  logic?: 'AND' | 'OR'
}

interface BuilderAction {
  id: string
  type: string
  config: Record<string, string>
}

type ViewType = 'home' | 'template-setup' | 'custom-builder'

// ── Static data ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'followup-email',      name: 'Follow-up Email Agent',        desc: "Automatically sends a follow-up email to prospects who haven't responded in X days", icon: 'Mail',         category: 'COMMUNICATION', popular: true,  color: '#16A34A', bg: 'rgba(22,163,74,0.1)',    defaultName: 'Follow-up Email Agent', defaultIcon: 'Mail' },
  { id: 'invoice-reminder',    name: 'Invoice Reminder Agent',       desc: 'Sends polite payment reminders when invoices are overdue by X days',                icon: 'Bell',         category: 'COMMUNICATION', popular: false, color: '#16A34A', bg: 'rgba(22,163,74,0.1)',    defaultName: 'Invoice Reminder',      defaultIcon: 'Bell' },
  { id: 'new-client-welcome',  name: 'New Client Welcome Agent',     desc: 'Sends a personalized welcome email when you add a new client to your CRM',          icon: 'UserPlus',     category: 'COMMUNICATION', popular: false, color: '#16A34A', bg: 'rgba(22,163,74,0.1)',    defaultName: 'New Client Welcome',    defaultIcon: 'UserPlus' },
  { id: 'project-kickoff',     name: 'Project Kickoff Agent',        desc: 'Sends a project kickoff message with next steps when a proposal is accepted',        icon: 'Rocket',       category: 'COMMUNICATION', popular: false, color: '#16A34A', bg: 'rgba(22,163,74,0.1)',    defaultName: 'Project Kickoff Agent', defaultIcon: 'Rocket' },
  { id: 'proposal-followup',   name: 'Proposal Follow-up Agent',     desc: 'Follows up on sent proposals after X days if no response',                          icon: 'FileText',     category: 'PROPOSALS',     popular: false, color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  defaultName: 'Proposal Follow-up',    defaultIcon: 'FileText' },
  { id: 'proposal-won',        name: 'Proposal Won Celebration',     desc: 'Sends a warm congratulations to yourself and a thank you to the client when a proposal is marked Won', icon: 'Award', category: 'PROPOSALS', popular: false, color: '#6366F1', bg: 'rgba(99,102,241,0.1)', defaultName: 'Proposal Won Agent', defaultIcon: 'Award' },
  { id: 'weekly-revenue',      name: 'Weekly Revenue Report Agent',  desc: 'Sends you a weekly summary of revenue, outstanding invoices, and upcoming payments every Monday morning', icon: 'BarChart2', category: 'FINANCE', popular: false, color: '#D97706', bg: 'rgba(217,119,6,0.1)', defaultName: 'Weekly Revenue Report', defaultIcon: 'BarChart2' },
  { id: 'low-invoice-alert',   name: 'Low Invoice Alert Agent',      desc: 'Alerts you when you have fewer than X active invoices — your pipeline reminder',     icon: 'AlertCircle',  category: 'FINANCE',       popular: false, color: '#D97706', bg: 'rgba(217,119,6,0.1)',   defaultName: 'Low Invoice Alert',     defaultIcon: 'AlertCircle' },
  { id: 'community-welcome',   name: 'New Member Welcome Agent',     desc: 'Welcomes new GuildWire community members with a personal message when they join',    icon: 'Users',        category: 'COMMUNITY',     popular: false, color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)', defaultName: 'Community Welcome',     defaultIcon: 'Users' },
]

type FieldType = 'number' | 'select' | 'textarea' | 'text' | 'time'
interface TemplateField { key: string; label: string; type: FieldType; options?: string[]; default: string; hint?: string }

const TEMPLATE_FIELDS: Record<string, TemplateField[]> = {
  'followup-email':     [ { key: 'days', label: 'Send follow-up after how many days?', type: 'number', default: '3' }, { key: 'clients', label: 'Which clients to include?', type: 'select', options: ['All clients', 'Specific tags', 'Specific clients'], default: 'All clients' }, { key: 'tone', label: 'Email tone?', type: 'select', options: ['Professional', 'Warm', 'Direct'], default: 'Professional' }, { key: 'custom_message', label: 'Custom message to add?', type: 'textarea', default: '', hint: 'Optional — AI personalizes the rest' } ],
  'invoice-reminder':   [ { key: 'days', label: 'Send reminder when overdue by how many days?', type: 'number', default: '7' }, { key: 'tone', label: 'Reminder tone?', type: 'select', options: ['Polite', 'Firm', 'Final notice'], default: 'Polite' }, { key: 'include_link', label: 'Include payment link?', type: 'select', options: ['Yes', 'No'], default: 'Yes' } ],
  'new-client-welcome': [ { key: 'tone', label: 'Welcome tone?', type: 'select', options: ['Professional', 'Warm', 'Personal'], default: 'Warm' }, { key: 'delay', label: 'Send welcome after?', type: 'select', options: ['Immediately', 'After 1 hour', 'Next morning'], default: 'Immediately' }, { key: 'include_contract', label: 'Attach contract reminder?', type: 'select', options: ['Yes', 'No'], default: 'Yes' } ],
  'project-kickoff':    [ { key: 'include_timeline', label: 'Include project timeline?', type: 'select', options: ['Yes', 'No'], default: 'Yes' }, { key: 'book_meeting', label: 'Prompt to book kickoff call?', type: 'select', options: ['Yes', 'No'], default: 'Yes' }, { key: 'tone', label: 'Tone?', type: 'select', options: ['Excited', 'Professional', 'Casual'], default: 'Excited' } ],
  'proposal-followup':  [ { key: 'days', label: 'Follow up after how many days?', type: 'number', default: '5' }, { key: 'max_followups', label: 'Max follow-ups before stopping?', type: 'number', default: '2' }, { key: 'tone', label: 'Tone?', type: 'select', options: ['Professional', 'Persistent', 'Casual'], default: 'Professional' } ],
  'proposal-won':       [ { key: 'notify_me', label: 'Notify yourself?', type: 'select', options: ['Yes', 'No'], default: 'Yes' }, { key: 'send_client_thanks', label: 'Send thank you to client?', type: 'select', options: ['Yes', 'No'], default: 'Yes' }, { key: 'emoji', label: 'Celebration emoji?', type: 'select', options: ['🎉', '🏆', '✨', '🚀'], default: '🎉' } ],
  'weekly-revenue':     [ { key: 'day', label: 'Send report on?', type: 'select', options: ['Monday', 'Sunday', 'Friday'], default: 'Monday' }, { key: 'time', label: 'At what time?', type: 'text', default: '08:00' }, { key: 'include_unpaid', label: 'Include unpaid invoices section?', type: 'select', options: ['Yes', 'No'], default: 'Yes' } ],
  'low-invoice-alert':  [ { key: 'threshold', label: 'Alert when fewer than X active invoices?', type: 'number', default: '3' }, { key: 'notify_via', label: 'Notify via?', type: 'select', options: ['Email', 'Notification', 'Both'], default: 'Email' } ],
  'community-welcome':  [ { key: 'message', label: 'Custom welcome message?', type: 'textarea', default: '', hint: 'Optional — AI generates a personalized message' }, { key: 'delay', label: 'Send after?', type: 'select', options: ['Immediately', 'After 10 mins', 'After 1 hour'], default: 'After 10 mins' } ],
}

const TRIGGER_OPTIONS = [
  { value: 'invoice-paid',       label: 'When an invoice is paid',                   icon: 'DollarSign'  },
  { value: 'invoice-overdue',    label: 'When an invoice becomes overdue',            icon: 'AlertCircle' },
  { value: 'recurring-invoice-sent', label: 'When a recurring invoice sends',        icon: 'RefreshCw'   },
  { value: 'new-client',         label: 'When a new client is added',                 icon: 'UserPlus'    },
  { value: 'proposal-sent',      label: 'When a proposal is sent',                    icon: 'Send'        },
  { value: 'proposal-accepted',  label: 'When a proposal is accepted or rejected',    icon: 'CheckSquare' },
  { value: 'schedule',           label: 'On a schedule (daily / weekly / monthly)',   icon: 'Calendar'    },
  { value: 'transcription-done', label: 'When a transcription is completed',          icon: 'Mic'         },
  { value: 'manual',             label: 'Manually (run on demand)',                   icon: 'Play'        },
]

const CONDITION_TYPES = [
  { value: 'client-tag',      label: 'Client has tag',                  suffix: '', placeholder: 'VIP, Prospect…' },
  { value: 'invoice-amount',  label: 'Invoice amount greater than $',   suffix: '', placeholder: '1000' },
  { value: 'inactive-days',   label: 'Client inactive for',             suffix: 'days', placeholder: '30' },
]

const ACTION_TYPES = [
  { value: 'send-email',      label: 'Send an email',             icon: 'Mail'       },
  { value: 'notify-me',       label: 'Send me a notification',    icon: 'Bell'       },
  { value: 'create-task',     label: 'Create a task in CRM',      icon: 'CheckSquare'},
  { value: 'add-note',        label: 'Add a note to client',      icon: 'Edit3'      },
  { value: 'update-status',   label: 'Update client status',      icon: 'RefreshCw'  },
  { value: 'generate-report', label: 'Generate a report',         icon: 'BarChart2'  },
  { value: 'wait',            label: 'Wait X days then continue', icon: 'Clock'      },
]

const ICON_OPTIONS = [
  'Bot', 'Zap', 'Cpu', 'Database', 'Globe', 'Layers', 'Shield', 'Target',
  'Mail', 'Bell', 'Send', 'Rocket', 'BarChart2', 'TrendingUp', 'Activity',
  'DollarSign', 'FileText', 'Award', 'UserPlus', 'Users', 'Calendar', 'Clock',
  'Mic', 'CheckSquare', 'AlertCircle', 'RefreshCw', 'Search', 'Link', 'Settings2', 'Star',
]

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Bot, Zap, Cpu, Database, Globe, Layers, Shield, Target,
  Mail, Bell, Send, Rocket, BarChart2, TrendingUp, Activity,
  DollarSign, FileText, Award, UserPlus, Users, Calendar, Clock,
  Mic, CheckSquare, AlertCircle, RefreshCw, Search, Link, Settings2, Star,
  Edit3, Play,
}

function AgentIcon({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) {
  const Comp = ICON_MAP[icon]
  if (Comp) return <Comp size={size} color={color} />
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{icon}</span>
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  const w = 68, h = 24
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts: [number, number][] = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fill = `${line} L${w},${h} L0,${h} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`asg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#asg${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={2.5} fill={color} />
    </svg>
  )
}

const VARIABLES = ['{{client_name}}', '{{invoice_amount}}', '{{due_date}}', '{{my_name}}', '{{company_name}}', '{{invoice_id}}']

// ── Helper functions ──────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function getPreviewEmail(templateId: string, config: Record<string, string>): string {
  const days = config.days || '3'
  const tone = config.tone || 'Professional'
  const msg = config.custom_message || ''
  switch (templateId) {
    case 'followup-email':
      return `Subject: Quick check-in from {{my_name}}

Hi {{client_name}},

I hope you're doing well! I'm following up from our last conversation — it's been ${days} days and I wanted to make sure you had everything you needed.
${msg ? '\n' + msg + '\n' : ''}
${tone === 'Warm' ? "I'd love to reconnect and answer any questions!" : tone === 'Direct' ? 'Please let me know your decision by end of week.' : "I'm happy to jump on a quick call if that would be helpful."}

Best,
{{my_name}}`
    case 'invoice-reminder':
      return `Subject: Friendly reminder: Invoice {{invoice_id}} due

Hi {{client_name}},

I'm reaching out regarding invoice {{invoice_id}} for {{invoice_amount}}, which was due ${days} days ago.

${tone === 'Firm' ? 'Please arrange payment within 3 business days.' : tone === 'Final notice' ? 'This is a final notice before we proceed further.' : "If there are any issues, please don't hesitate to reach out."}

Pay here: {{payment_link}}

Thank you,
{{my_name}}`
    case 'new-client-welcome':
      return `Subject: Welcome aboard, {{client_name}}! 🎉

Hi {{client_name}},

I'm thrilled to be working with you! Here's what to expect next:

• Kickoff call scheduling within 24 hours
• Project overview doc by end of week${config.include_contract === 'Yes' ? '\n• Contract attached for your review' : ''}

Looking forward to delivering great work together!

Warmly,
{{my_name}}`
    case 'weekly-revenue':
      return `Subject: 📊 Your Weekly Revenue Report — Week of {{week_start}}

Hi {{my_name}},

Here's your revenue summary for this week:

💰 Revenue collected: \${{weekly_revenue}}
📄 Outstanding invoices: \${{outstanding_total}}
📅 Due this week: {{invoices_due_count}} invoice(s)
${config.include_unpaid === 'Yes' ? '⚠️ Overdue: {{overdue_count}} invoice(s)\n' : ''}
Keep up the great work!

— GuildWire AI`
    default:
      return `Subject: Update from GuildWire

Hi {{client_name}},

This message was sent automatically by your GuildWire agent.

Best,
{{my_name}}`
  }
}

function getTestRunResult(templateId: string, config: Record<string, string>): string {
  const days = config.days || '3'
  switch (templateId) {
    case 'followup-email':   return `✓ Would send follow-up emails to 3 prospects:\n  → Sarah Chen (Acme Corp) — no response for ${days}d\n  → Raj Patel (TechFlow) — no response for ${days}d\n  → James Park (Hencewood) — no response for ${days}d`
    case 'invoice-reminder': return `✓ Would send payment reminders for 2 overdue invoices:\n  → INV-088 ($9,800) — ${days}d overdue — DataSync\n  → INV-089 ($6,200) — ${days}d overdue — NovaBuild`
    case 'weekly-revenue':   return `✓ Would send weekly report:\n  → Revenue: $68,400 (this week)\n  → Outstanding: $15,800 across 2 invoices\n  → No invoices overdue`
    default:                 return `✓ Agent would run successfully with current configuration.\n  → 0 errors found in configuration\n  → Ready to activate`
  }
}

function getAiEmail(trigger: string): { subject: string; body: string } {
  switch (trigger) {
    case 'invoice-paid':   return { subject: 'Payment received — thank you, {{client_name}}!', body: 'Hi {{client_name}},\n\nThank you for your payment of {{invoice_amount}} for invoice {{invoice_id}}. It\'s been received and processed.\n\nIf you have any questions, feel free to reach out.\n\nBest,\n{{my_name}}' }
    case 'invoice-overdue': return { subject: 'Friendly reminder: Invoice {{invoice_id}} is overdue', body: 'Hi {{client_name}},\n\nI wanted to follow up on invoice {{invoice_id}} for {{invoice_amount}}, which was due on {{due_date}}.\n\nPlease let me know if you have any questions or need an alternative arrangement.\n\nThank you,\n{{my_name}}' }
    case 'new-client':      return { subject: 'Welcome to the team, {{client_name}}! 🎉', body: 'Hi {{client_name}},\n\nWelcome aboard! I\'m excited to start working together.\n\nI\'ll be in touch shortly to schedule our kickoff call and share the next steps.\n\nLooking forward to it,\n{{my_name}}' }
    default:                return { subject: 'Update from {{my_name}}', body: 'Hi {{client_name}},\n\nThis is an automated message from your GuildWire agent.\n\nBest,\n{{my_name}}' }
  }
}

const CATEGORY_COLORS: Record<string, { accent: string; bg: string }> = {
  COMMUNICATION: { accent: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  PROPOSALS:     { accent: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  FINANCE:       { accent: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  COMMUNITY:     { accent: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewType>('home')
  const [activeTab, setActiveTab] = useState<'agents' | 'templates'>('agents')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [agentMenuId, setAgentMenuId] = useState<number | null>(null)
  const [runningId, setRunningId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Template setup
  const [setupTemplate, setSetupTemplate] = useState<typeof TEMPLATES[0] | null>(null)
  const [setupStep, setSetupStep] = useState(1)
  const [setupConfig, setSetupConfig] = useState<Record<string, string>>({})
  const [setupSchedule, setSetupSchedule] = useState('trigger')
  const [setupScheduleTime, setSetupScheduleTime] = useState('08:00')
  const [setupScheduleDay, setSetupScheduleDay] = useState('Monday')
  const [agentName, setAgentName] = useState('')
  const [agentIcon, setAgentIcon] = useState('Bot')
  const [showPreview, setShowPreview] = useState(false)
  const [showTestRun, setShowTestRun] = useState(false)
  const [testRunning, setTestRunning] = useState(false)
  const [activating, setActivating] = useState(false)

  // Custom builder
  const [builderTrigger, setBuilderTrigger] = useState('')
  const [builderConditions, setBuilderConditions] = useState<BuilderCondition[]>([])
  const [builderActions, setBuilderActions] = useState<BuilderAction[]>([])
  const [selectedActionIdx, setSelectedActionIdx] = useState<number | null>(null)
  const [builderName, setBuilderName] = useState('')
  const [builderIcon, setBuilderIcon] = useState('Bot')
  const [aiEmailLoading, setAiEmailLoading] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailTo, setEmailTo] = useState('client')
  const [savingBuilder, setSavingBuilder] = useState(false)

  // Load agents
  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAgents(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Close agent menu on outside click
  useEffect(() => {
    if (!agentMenuId) return
    const close = () => setAgentMenuId(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [agentMenuId])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg)
  }

  async function toggleStatus(agent: Agent) {
    const status = agent.status === 'active' ? 'paused' : 'active'
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status } : a))
    await fetch(`/api/agents/${agent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => {})
    showToast(status === 'active' ? `${agent.name} activated` : `${agent.name} paused`)
  }

  async function deleteAgent(id: number) {
    await fetch(`/api/agents/${id}`, { method: 'DELETE' }).catch(() => {})
    setAgents(prev => prev.filter(a => a.id !== id))
    setAgentMenuId(null)
    showToast('Agent deleted')
  }

  async function runNow(agent: Agent) {
    setRunningId(agent.id)
    await fetch(`/api/agents/${agent.id}/run`, { method: 'POST' }).catch(() => {})
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, run_count: a.run_count + 1, last_run: new Date().toISOString() } : a))
    setRunningId(null)
    showToast(`${agent.name} ran successfully`)
  }

  function openTemplateSetup(template: typeof TEMPLATES[0]) {
    const fields = TEMPLATE_FIELDS[template.id] || []
    const defaults: Record<string, string> = {}
    fields.forEach(f => { defaults[f.key] = f.default })
    setSetupTemplate(template)
    setSetupConfig(defaults)
    setSetupStep(1)
    setAgentName(template.defaultName)
    setAgentIcon(template.defaultIcon)
    setShowPreview(false)
    setShowTestRun(false)
    setView('template-setup')
  }

  async function activateTemplate() {
    if (!setupTemplate) return
    setActivating(true)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: agentName || setupTemplate.defaultName,
        icon: agentIcon,
        description: setupTemplate.desc,
        status: 'active',
        trigger_type: setupSchedule === 'trigger' ? 'event' : 'schedule',
        trigger_config: { schedule: setupSchedule, time: setupScheduleTime, day: setupScheduleDay, ...setupConfig },
        conditions: [],
        actions: [{ type: 'send-email', to: 'client' }],
        template_id: setupTemplate.id,
      }),
    })
    if (res.ok) {
      const agent = await res.json()
      setAgents(prev => [agent, ...prev])
      showToast(`${agent.name} is now active!`)
    }
    setActivating(false)
    setView('home')
    setActiveTab('agents')
  }

  function addCondition() {
    setBuilderConditions(prev => [...prev, { id: Date.now().toString(), type: 'client-tag', value: '', logic: prev.length > 0 ? 'AND' : undefined }])
  }

  function addAction() {
    const newAction: BuilderAction = { id: Date.now().toString(), type: '', config: {} }
    setBuilderActions(prev => [...prev, newAction])
    setSelectedActionIdx(builderActions.length)
  }

  function removeAction(idx: number) {
    setBuilderActions(prev => prev.filter((_, i) => i !== idx))
    if (selectedActionIdx === idx) setSelectedActionIdx(null)
  }

  async function aiWriteEmail() {
    setAiEmailLoading(true)
    await new Promise(r => setTimeout(r, 900))
    const { subject, body } = getAiEmail(builderTrigger)
    setEmailSubject(subject)
    setEmailBody(body)
    setAiEmailLoading(false)
  }

  function insertVariable(v: string) {
    setEmailBody(prev => prev + ' ' + v)
  }

  async function saveBuilderAgent() {
    if (!builderTrigger || builderActions.length === 0) {
      showToast('Add a trigger and at least one action')
      return
    }
    setSavingBuilder(true)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: builderName || 'Custom Agent',
        icon: builderIcon,
        description: `Triggered: ${TRIGGER_OPTIONS.find(t => t.value === builderTrigger)?.label || builderTrigger}`,
        status: 'active',
        trigger_type: builderTrigger,
        trigger_config: {},
        conditions: builderConditions,
        actions: builderActions,
        template_id: '',
      }),
    })
    if (res.ok) {
      const agent = await res.json()
      setAgents(prev => [agent, ...prev])
      showToast(`${agent.name} is now active!`)
    }
    setSavingBuilder(false)
    setView('home')
    setActiveTab('agents')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const templatesByCategory = TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, typeof TEMPLATES>)

  // ── View: Custom Builder ──────────────────────────────────────────────────

  if (view === 'custom-builder') {
    const selectedAction = selectedActionIdx !== null ? builderActions[selectedActionIdx] : null
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', background: '#F8FAFC' }}>
        <style>{`@keyframes ag-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.ag-fade{animation:ag-fade 0.18s ease}.builder-col{background:#fff;border:1px solid #E9EBF0;border-radius:16px;padding:20px;flex:1;min-width:220px}.builder-col.selected{border-color:rgba(22,163,74,0.4);box-shadow:0 0 0 3px rgba(22,163,74,0.08)}.action-chip:hover{background:rgba(22,163,74,0.06)!important}.cond-row:hover .cond-del{opacity:1!important}.act-row:hover .act-del{opacity:1!important}`}</style>

        {/* Header */}
        <div style={{ padding: '18px 28px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>
            ← Back
          </button>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Custom Agent Builder</span>
        </div>

        <div style={{ padding: '16px 28px 40px' }}>
          {/* Agent name + icon row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AgentIcon icon={builderIcon} size={26} color="#16A34A" />
            </div>
            <div>
              <input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="Name your agent…"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#111827', border: 'none', outline: 'none', background: 'transparent', letterSpacing: '-0.02em' }} />
              <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                {ICON_OPTIONS.slice(0, 12).map(name => (
                  <button key={name} onClick={() => setBuilderIcon(name)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: builderIcon === name ? '2px solid #16A34A' : '2px solid transparent', background: builderIcon === name ? 'rgba(22,163,74,0.08)' : '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                    <AgentIcon icon={name} size={15} color={builderIcon === name ? '#16A34A' : '#6B7280'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3-column builder */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
            {/* Column 1: Trigger */}
            <div className={`builder-col${builderTrigger ? ' selected' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={14} color="#16A34A" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>TRIGGER</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>When does this run?</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TRIGGER_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setBuilderTrigger(t.value)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, border: builderTrigger === t.value ? '1.5px solid #16A34A' : '1.5px solid #F3F4F6', background: builderTrigger === t.value ? 'rgba(22,163,74,0.06)' : '#F8FAFC', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                  >
                    <span style={{ width: 20, flexShrink: 0, display: 'flex' }}><AgentIcon icon={t.icon} size={15} color={builderTrigger === t.value ? '#16A34A' : '#6B7280'} /></span>
                    <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>{t.label}</span>
                    {builderTrigger === t.value && <Check size={13} color="#16A34A" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow 1→2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px', paddingTop: 50 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, rgba(22,163,74,0.3), rgba(22,163,74,0.6))', borderRadius: 1 }} />
                <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid rgba(22,163,74,0.6)' }} />
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 4 }}>then</span>
            </div>

            {/* Column 2: Conditions */}
            <div className="builder-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings2 size={14} color="#6366F1" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>CONDITIONS</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>Optional filters</div>
                </div>
              </div>

              {builderConditions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 12, fontFamily: 'var(--font-body)' }}>No conditions — runs every time</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {builderConditions.map((cond, idx) => {
                    const ct = CONDITION_TYPES.find(c => c.value === cond.type)
                    return (
                      <div key={cond.id} className="cond-row" style={{ position: 'relative' }}>
                        {idx > 0 && (
                          <button onClick={() => setBuilderConditions(prev => prev.map((c, i) => i === idx ? { ...c, logic: c.logic === 'AND' ? 'OR' : 'AND' } : c))}
                            style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                            {cond.logic}
                          </button>
                        )}
                        <div style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E9EBF0', background: '#F8FAFC' }}>
                          <select value={cond.type} onChange={e => setBuilderConditions(prev => prev.map((c, i) => i === idx ? { ...c, type: e.target.value } : c))}
                            style={{ width: '100%', fontSize: 12, color: '#374151', border: 'none', background: 'transparent', outline: 'none', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                            {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <input value={cond.value} onChange={e => setBuilderConditions(prev => prev.map((c, i) => i === idx ? { ...c, value: e.target.value } : c))}
                            placeholder={ct?.placeholder || 'Value…'}
                            style={{ width: '100%', fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', outline: 'none', fontFamily: 'var(--font-body)' }} />
                        </div>
                        <button className="cond-del" onClick={() => setBuilderConditions(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s', padding: 2 }}>
                          <X size={12} color="#9CA3AF" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button onClick={addCondition}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed #D1D5DB', background: 'transparent', color: '#6B7280', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>
                <Plus size={13} /> Add condition
              </button>
            </div>

            {/* Arrow 2→3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px', paddingTop: 50 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, rgba(22,163,74,0.3), rgba(22,163,74,0.6))', borderRadius: 1 }} />
                <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid rgba(22,163,74,0.6)' }} />
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 4 }}>then</span>
            </div>

            {/* Column 3: Actions */}
            <div className="builder-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Rocket size={14} color="#0EA5E9" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>ACTIONS</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>What does it do?</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {builderActions.map((action, idx) => {
                  const at = ACTION_TYPES.find(a => a.value === action.type)
                  return (
                    <div key={action.id} className="act-row" style={{ position: 'relative' }}>
                      <button onClick={() => setSelectedActionIdx(idx === selectedActionIdx ? null : idx)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, border: selectedActionIdx === idx ? '1.5px solid #0EA5E9' : '1.5px solid #E9EBF0', background: selectedActionIdx === idx ? 'rgba(14,165,233,0.06)' : '#F8FAFC', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ display: 'flex' }}><AgentIcon icon={at?.icon || 'Settings2'} size={15} color="#6B7280" /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {action.type ? (
                            <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>{at?.label || action.type}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Choose action…</span>
                          )}
                        </div>
                        <ChevronRight size={13} color="#9CA3AF" />
                      </button>
                      <button className="act-del" onClick={() => removeAction(idx)}
                        style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#E5E7EB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                        <X size={10} color="#6B7280" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <button onClick={addAction}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed #D1D5DB', background: 'transparent', color: '#6B7280', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>
                <Plus size={13} /> Add action
              </button>
            </div>
          </div>

          {/* Action config panel */}
          {selectedAction !== null && (
            <div className="ag-fade" style={{ marginTop: 16, background: '#fff', border: '1px solid #E9EBF0', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 14, fontFamily: 'var(--font-body)' }}>ACTION CONFIGURATION</div>

              {/* Action type selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {ACTION_TYPES.map(at => (
                  <button key={at.value} onClick={() => {
                    if (selectedActionIdx !== null) {
                      setBuilderActions(prev => prev.map((a, i) => i === selectedActionIdx ? { ...a, type: at.value, config: {} } : a))
                    }
                  }}
                    className="action-chip"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: selectedAction?.type === at.value ? '1.5px solid #16A34A' : '1.5px solid #E9EBF0', background: selectedAction?.type === at.value ? 'rgba(22,163,74,0.07)' : '#F8FAFC', cursor: 'pointer', fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', transition: 'all 0.12s' }}>
                    <AgentIcon icon={at.icon} size={13} color={selectedAction?.type === at.value ? '#16A34A' : '#6B7280'} /> {at.label}
                  </button>
                ))}
              </div>

              {/* Email composer */}
              {selectedAction?.type === 'send-email' && (
                <div className="ag-fade">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
                      <select value={emailTo} onChange={e => setEmailTo(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
                        <option value="client">{'Client ({{client_name}})'}</option>
                        <option value="me">Myself</option>
                        <option value="custom">Custom email</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
                      <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject…"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body</label>
                    <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={5} placeholder="Email body…"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Insert:</span>
                    {VARIABLES.map(v => (
                      <button key={v} onClick={() => insertVariable(v)}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F8FAFC', cursor: 'pointer', color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                        {v}
                      </button>
                    ))}
                    <button onClick={aiWriteEmail} disabled={aiEmailLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: aiEmailLoading ? 'wait' : 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                      <Sparkles size={13} /> {aiEmailLoading ? 'Writing…' : 'AI Write This Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notification config */}
              {selectedAction?.type === 'notify-me' && (
                <div className="ag-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
                    <input placeholder="Notification title…" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                    <input placeholder="Notification message…" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                </div>
              )}

              {/* Task config */}
              {selectedAction?.type === 'create-task' && (
                <div className="ag-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title</label>
                    <input placeholder="Follow up with {{'{{'}}client_name{'}}'}}…" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due in</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
                      <option>1 day</option><option>3 days</option><option>7 days</option><option>14 days</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Wait config */}
              {selectedAction?.type === 'wait' && (
                <div className="ag-fade" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Wait</span>
                  <input type="number" defaultValue={3} min={1} style={{ width: 70, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>days, then continue to the next action</span>
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
            <button onClick={() => setView('home')} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
            <button onClick={saveBuilderAgent} disabled={savingBuilder || !builderTrigger || builderActions.length === 0}
              style={{ padding: '10px 24px', borderRadius: 10, background: !builderTrigger || builderActions.length === 0 ? '#E5E7EB' : '#16A34A', color: !builderTrigger || builderActions.length === 0 ? '#9CA3AF' : '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: !builderTrigger || builderActions.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {savingBuilder ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
              {savingBuilder ? 'Saving…' : 'Activate Agent'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── View: Template Setup ──────────────────────────────────────────────────

  if (view === 'template-setup' && setupTemplate) {
    const fields = TEMPLATE_FIELDS[setupTemplate.id] || []
    const previewEmail = getPreviewEmail(setupTemplate.id, setupConfig)
    const testResult = getTestRunResult(setupTemplate.id, setupConfig)
    const cc = CATEGORY_COLORS[setupTemplate.category] ?? { accent: '#16A34A', bg: 'rgba(22,163,74,0.1)' }

    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', background: '#F8FAFC' }}>
        <style>{`@keyframes ag-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.ag-fade{animation:ag-fade 0.18s ease}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

        {/* Header */}
        <div style={{ padding: '18px 28px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { setView('home'); setActiveTab('templates') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>
            ← Back
          </button>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>{setupTemplate.name}</span>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 28px 60px' }}>
          {/* Template header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: cc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cc.accent}20` }}><AgentIcon icon={setupTemplate.icon} size={26} color={cc.accent} /></div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{setupTemplate.name}</h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>{setupTemplate.desc}</p>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {[1, 2, 3].map((step, idx) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: setupStep >= step ? cc.accent : '#E5E7EB', color: setupStep >= step ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {setupStep > step ? <Check size={13} strokeWidth={3} /> : step}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: setupStep === step ? 700 : 400, color: setupStep >= step ? '#111827' : '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                    {step === 1 ? 'Configure' : step === 2 ? 'Schedule' : 'Activate'}
                  </span>
                </div>
                {idx < 2 && <div style={{ width: 40, height: 1, background: setupStep > step ? cc.accent : '#E5E7EB', margin: '0 12px' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Configure */}
          {setupStep === 1 && (
            <div className="ag-fade">
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E9EBF0', padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 18px' }}>Configure your agent</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {fields.map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select value={setupConfig[field.key] || field.default} onChange={e => setSetupConfig(p => ({ ...p, [field.key]: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
                          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : field.type === 'number' ? (
                        <input type="number" value={setupConfig[field.key] || field.default} onChange={e => setSetupConfig(p => ({ ...p, [field.key]: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', outline: 'none' }} />
                      ) : field.type === 'textarea' ? (
                        <textarea value={setupConfig[field.key] || ''} onChange={e => setSetupConfig(p => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.hint || 'Optional'} rows={3}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none' }} />
                      ) : (
                        <input value={setupConfig[field.key] || field.default} onChange={e => setSetupConfig(p => ({ ...p, [field.key]: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', outline: 'none' }} />
                      )}
                      {field.hint && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>{field.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview email */}
              {['followup-email','invoice-reminder','new-client-welcome','project-kickoff','proposal-followup','proposal-won','weekly-revenue'].includes(setupTemplate.id) && (
                <>
                  <button onClick={() => setShowPreview(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                    <Mail size={14} /> {showPreview ? 'Hide' : 'Preview'} Email
                    <ChevronDown size={13} style={{ transform: showPreview ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {showPreview && (
                    <div className="ag-fade" style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E9EBF0', padding: '14px 16px', marginBottom: 12 }}>
                      <pre style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{previewEmail}</pre>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSetupStep(2)} style={{ padding: '10px 24px', borderRadius: 10, background: cc.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Next: Schedule <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {setupStep === 2 && (
            <div className="ag-fade">
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E9EBF0', padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 18px' }}>When should this agent run?</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{ value: 'trigger', label: 'Immediately when triggered', desc: 'Runs automatically when the trigger event happens' }, { value: 'daily', label: 'Daily at a specific time', desc: 'Checks conditions and runs once per day' }, { value: 'weekly', label: 'Weekly on a specific day', desc: 'Runs on the same day every week' }].map(opt => (
                    <button key={opt.value} onClick={() => setSetupSchedule(opt.value)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, border: setupSchedule === opt.value ? `1.5px solid ${cc.accent}` : '1.5px solid #E9EBF0', background: setupSchedule === opt.value ? `${cc.bg}` : '#F8FAFC', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${setupSchedule === opt.value ? cc.accent : '#D1D5DB'}`, background: setupSchedule === opt.value ? cc.accent : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {setupSchedule === opt.value && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {setupSchedule === 'daily' && (
                  <div className="ag-fade" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Run at</span>
                    <input type="time" value={setupScheduleTime} onChange={e => setSetupScheduleTime(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                )}
                {setupSchedule === 'weekly' && (
                  <div className="ag-fade" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Every</span>
                    <select value={setupScheduleDay} onChange={e => setSetupScheduleDay(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>at</span>
                    <input type="time" value={setupScheduleTime} onChange={e => setSetupScheduleTime(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                )}
              </div>

              {/* Test run */}
              <div style={{ marginBottom: 16 }}>
                <button onClick={async () => { setTestRunning(true); await new Promise(r => setTimeout(r, 900)); setTestRunning(false); setShowTestRun(true) }}
                  disabled={testRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: testRunning ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {testRunning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                  {testRunning ? 'Running test…' : 'Test Run'}
                </button>
                {showTestRun && (
                  <div className="ag-fade" style={{ marginTop: 10, background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0', padding: '12px 14px' }}>
                    <pre style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#15803D', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{testResult}</pre>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setSetupStep(1)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
                <button onClick={() => setSetupStep(3)} style={{ padding: '10px 24px', borderRadius: 10, background: cc.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Next: Activate <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Activate */}
          {setupStep === 3 && (
            <div className="ag-fade">
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E9EBF0', padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Almost there!</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', fontFamily: 'var(--font-body)' }}>Review your agent and give it a name.</p>

                {/* Summary */}
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10, fontFamily: 'var(--font-body)' }}>WHAT THIS AGENT WILL DO</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: cc.accent, fontWeight: 700 }}>↻</span>
                      {setupSchedule === 'trigger' ? 'Runs automatically when triggered' : setupSchedule === 'daily' ? `Runs daily at ${setupScheduleTime}` : `Runs every ${setupScheduleDay} at ${setupScheduleTime}`}
                    </div>
                    {Object.entries(setupConfig).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>
                        <span style={{ color: cc.accent }}>→</span> <strong>{k.replace(/_/g, ' ')}:</strong> {v}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Agent name</label>
                  <input value={agentName} onChange={e => setAgentName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', fontFamily: 'var(--font-body)', outline: 'none' }} />
                </div>

                {/* Icon picker */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Choose an icon</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ICON_OPTIONS.map(name => (
                      <button key={name} onClick={() => setAgentIcon(name)}
                        style={{ width: 40, height: 40, borderRadius: 10, border: agentIcon === name ? `2px solid ${cc.accent}` : '2px solid #E5E7EB', background: agentIcon === name ? cc.bg : '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                        <AgentIcon icon={name} size={18} color={agentIcon === name ? cc.accent : '#9CA3AF'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setSetupStep(2)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
                <button onClick={activateTemplate} disabled={activating}
                  style={{ padding: '11px 28px', borderRadius: 10, background: cc.accent, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: activating ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 7, boxShadow: `0 4px 16px ${cc.bg}` }}>
                  {activating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
                  {activating ? 'Activating…' : 'Activate Agent'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── View: Home ────────────────────────────────────────────────────────────

  const activeCount = agents.filter(a => a.status === 'active').length
  const totalRuns = agents.reduce((s, a) => s + a.run_count, 0)
  const latestRun = agents.reduce((best, a) => !best || (a.last_run && a.last_run > best) ? a.last_run : best, null as string | null)
  const kpis = [
    { label: 'Active Agents', value: loading ? '—' : String(activeCount), spark: [Math.max(0, activeCount - 2), Math.max(0, activeCount - 1), activeCount - 1, activeCount, activeCount, activeCount], color: '#16A34A' },
    { label: 'Total Runs',    value: loading ? '—' : String(totalRuns),    spark: [totalRuns * .4, totalRuns * .55, totalRuns * .7, totalRuns * .8, totalRuns * .9, totalRuns].map(Math.round), color: '#6366F1' },
    { label: 'Last Run',      value: loading ? '—' : relativeTime(latestRun), spark: [2, 4, 3, 6, 5, 7], color: '#D97706' },
  ]

  return (
    <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 52px' }}>
      <style>{`@keyframes ag-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ag-fade{animation:ag-fade 0.18s ease}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.agent-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.1)!important;transform:translateY(-1px)}.tmpl-card:hover{box-shadow:0 8px 28px rgba(0,0,0,0.1)!important;transform:translateY(-1px)}.agent-menu-item:hover{background:#F8FAFC!important}`}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em' }}>AI Agents</h1>
          <p style={{ fontSize: 15, color: '#6B7280', margin: 0, fontFamily: 'var(--font-body)' }}>Automate the repetitive parts of running your business. Build once, run forever.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setActiveTab('templates')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Sparkles size={14} /> Templates
          </button>
          <button onClick={() => { setBuilderTrigger(''); setBuilderConditions([]); setBuilderActions([]); setBuilderName(''); setBuilderIcon('Bot'); setView('custom-builder') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', borderRadius: 10, background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 1px 4px rgba(22,163,74,0.35)' }}>
            <Plus size={14} /> New Agent
          </button>
        </div>
      </div>

      {/* KPI stat bar */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={kpi.label} style={{ padding: '20px 24px', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>{kpi.value}</div>
              {!loading && <Sparkline values={kpi.spark} color={kpi.color} id={`kpi${i}`} />}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #E9EBF0', paddingBottom: 0 }}>
        {(['agents', 'templates'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '9px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: 'none', fontSize: 14, fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? '#111827' : '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)', borderBottom: activeTab === tab ? '2px solid #16A34A' : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
            {tab === 'agents' ? 'My Agents' : 'Templates'}
            {tab === 'agents' && agents.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280' }}>{agents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── MY AGENTS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'agents' && (
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 180, borderRadius: 16, background: 'linear-gradient(90deg, #E9EBF0 25%, #F3F4F6 50%, #E9EBF0 75%)', backgroundSize: '200% 100%', animation: 'spin 1.4s ease-in-out infinite' }} />)}
            </div>
          ) : agents.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '72px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Bot size={40} color="rgba(22,163,74,0.5)" strokeWidth={1.4} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>No agents yet</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', fontFamily: 'var(--font-body)' }}>Start with a template or build your own from scratch</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setActiveTab('templates')} className="btn-primary" style={{ fontSize: 13 }}>
                  <Sparkles size={14} /> Browse Templates
                </button>
                <button onClick={() => { setBuilderTrigger(''); setBuilderConditions([]); setBuilderActions([]); setBuilderName(''); setBuilderIcon('Bot'); setView('custom-builder') }} className="btn-outline" style={{ fontSize: 13 }}>
                  <Plus size={14} /> Build Custom Agent
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
                {agents.map(agent => {
                  const isActive = agent.status === 'active'
                  const runSpark = [
                    Math.max(0, agent.run_count - 5), Math.max(0, agent.run_count - 3),
                    Math.max(0, agent.run_count - 2), Math.max(0, agent.run_count - 1),
                    agent.run_count, agent.run_count,
                  ]
                  return (
                  <div key={agent.id} className="agent-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, position: 'relative', cursor: 'default', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${isActive ? '#16A34A' : '#E5E7EB'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: isActive ? 'rgba(22,163,74,0.08)' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AgentIcon icon={agent.icon} size={22} color={isActive ? '#16A34A' : '#6B7280'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{agent.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : '#D1D5DB', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: isActive ? '#16A34A' : '#9CA3AF', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                              {isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => toggleStatus(agent)} title={isActive ? 'Pause agent' : 'Activate agent'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                        {isActive ? <ToggleRight size={26} color="#16A34A" /> : <ToggleLeft size={26} color="#D1D5DB" />}
                      </button>
                    </div>

                    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px', fontFamily: 'var(--font-body)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {agent.description}
                    </p>

                    {/* Stats row with sparkline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14, background: '#F8FAFC', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ flex: 1, padding: '8px 12px', borderRight: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Runs</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{agent.run_count}</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px 12px', borderRight: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Last Run</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.1, marginTop: 2 }}>{relativeTime(agent.last_run)}</div>
                      </div>
                      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
                        <Sparkline values={runSpark} color={isActive ? '#16A34A' : '#D1D5DB'} id={`a${agent.id}`} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => router.push(`/agents/${agent.id}`)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.12s' }}>
                        View
                      </button>
                      <button onClick={() => runNow(agent)} disabled={runningId === agent.id || !isActive}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: !isActive ? '#F3F4F6' : '#16A34A', color: !isActive ? '#9CA3AF' : '#fff', fontSize: 12, fontWeight: 600, cursor: !isActive ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'opacity 0.12s' }}>
                        {runningId === agent.id ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} fill="currentColor" />}
                        Run Now
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button onClick={e => { e.stopPropagation(); setAgentMenuId(agentMenuId === agent.id ? null : agent.id) }}
                          style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Ellipsis size={15} color="#6B7280" />
                        </button>
                        {agentMenuId === agent.id && (
                          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: '#fff', border: '1px solid #E9EBF0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 155, overflow: 'hidden', zIndex: 50 }}>
                            <button className="agent-menu-item" onClick={() => { router.push(`/agents/${agent.id}`); setAgentMenuId(null) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                              <Activity size={13} color="#6B7280" /> View History
                            </button>
                            <div style={{ height: 1, background: '#F3F4F6' }} />
                            <button className="agent-menu-item" onClick={() => deleteAgent(agent.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', fontSize: 13, color: '#DC2626', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                              <Trash2 size={13} color="#DC2626" /> Delete Agent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div>
          {Object.entries(templatesByCategory).map(([category, templates]) => {
            const cc = CATEGORY_COLORS[category] ?? { accent: '#16A34A', bg: 'rgba(22,163,74,0.1)' }
            return (
              <div key={category} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: cc.accent }} />
                  <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cc.accent, margin: 0 }}>{category}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {templates.map(t => (
                    <div key={t.id} className="tmpl-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 14, borderLeft: `3px solid ${cc.accent}`, position: 'relative', overflow: 'hidden' }}>
                      {t.popular && (
                        <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(22,163,74,0.1)', color: '#15803D', fontWeight: 700, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>POPULAR</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: cc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cc.accent}20` }}><AgentIcon icon={t.icon} size={22} color={cc.accent} /></div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: t.popular ? 64 : 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em', marginBottom: 4 }}>{t.name}</div>
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{t.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => openTemplateSetup(t)}
                        style={{ width: '100%', padding: '9px 0', borderRadius: 9, background: cc.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Use Template <ChevronRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="ag-fade" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          <Check size={14} color="#4ADE80" strokeWidth={2.5} /> {toast}
        </div>
      )}
    </div>
  )
}
