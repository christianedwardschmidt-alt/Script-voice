'use client'

import React, { useState } from 'react'
import {
  Plus, X, ChevronRight, Mail, Bell, Users, CheckSquare, Edit3,
  RefreshCw, BarChart2, Clock, GitBranch,
} from 'lucide-react'
import {
  CONDITION_OPTIONS, DAY_NAMES, PROPOSAL_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS,
  conditionOptionValue, buildPlainEnglishSummary, describeActions,
  type ConditionType, type RuleConfig, type SimpleAction,
} from '@/lib/ruleUtils'

// ── Shared static data ───────────────────────────────────────────────────────

const NESTED_ACTION_TYPES: { value: string; label: string; icon: React.FC<{ size?: number; color?: string }> }[] = [
  { value: 'send-email', label: 'Send email', icon: Mail },
  { value: 'notify-me', label: 'Notify me', icon: Bell },
  { value: 'notify-collaborator', label: 'Notify collaborator', icon: Users },
  { value: 'create-task', label: 'Create task', icon: CheckSquare },
  { value: 'add-note', label: 'Add note', icon: Edit3 },
  { value: 'update-status', label: 'Update status', icon: RefreshCw },
  { value: 'generate-report', label: 'Generate report', icon: BarChart2 },
  { value: 'wait', label: 'Wait', icon: Clock },
]

const COLLAB_VARIABLES = ['{{client_name}}', '{{invoice_amount}}', '{{due_date}}', '{{proposal_title}}', '{{agent_name}}']

const NESTING_LIMIT_MESSAGE = 'Keep it simple — one level of branching keeps your agent reliable and easy to understand.'

export function defaultRuleConfig(): RuleConfig {
  return { conditionType: 'invoice-amount', operator: 'gt', value: '', ifActions: [], elseActions: [] }
}

interface Collaborator {
  id: number
  collaborator_name: string
  collaborator_email: string
  relationship: string
  is_guildwire_member: boolean
}

interface DocRef {
  id: string
  title: string
}

// ── Value input, by condition type ───────────────────────────────────────────

function ConditionValueInput({ rule, onChange }: { rule: RuleConfig; onChange: (rule: RuleConfig) => void }) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', background: '#fff',
  }

  switch (rule.conditionType) {
    case 'invoice-amount':
      return (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF' }}>$</span>
          <input type="number" min={0} value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })}
            placeholder="1000" style={{ ...inputStyle, paddingLeft: 22 }} />
        </div>
      )
    case 'days-since-contact':
      return (
        <input type="number" min={0} value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })}
          placeholder="30" style={inputStyle} />
      )
    case 'client-tag':
      return (
        <input value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })}
          placeholder="VIP, Prospect…" style={inputStyle} />
      )
    case 'proposal-status':
      return (
        <select value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} style={inputStyle}>
          <option value="">Choose a status…</option>
          {PROPOSAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    case 'invoice-status':
      return (
        <select value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} style={inputStyle}>
          <option value="">Choose a status…</option>
          {INVOICE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    case 'day-of-week': {
      const selected = rule.value ? rule.value.split(',').filter(Boolean) : []
      const toggle = (d: string) => {
        const next = selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d]
        onChange({ ...rule, value: next.join(',') })
      }
      return (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {DAY_NAMES.map(d => (
            <button key={d} type="button" onClick={() => toggle(d)}
              style={{
                padding: '5px 9px', borderRadius: 7, fontSize: 11.5, fontFamily: 'var(--font-body)', cursor: 'pointer',
                border: selected.includes(d) ? '1.5px solid #CA8A04' : '1.5px solid #E5E7EB',
                background: selected.includes(d) ? 'rgba(202,138,4,0.1)' : '#fff',
                color: selected.includes(d) ? '#92650A' : '#6B7280', fontWeight: selected.includes(d) ? 600 : 400,
              }}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      )
    }
    case 'time-of-day': {
      const [start, end] = (rule.value || '').split('-')
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="time" value={start || ''} onChange={e => onChange({ ...rule, value: `${e.target.value}-${end || ''}` })} style={inputStyle} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>to</span>
          <input type="time" value={end || ''} onChange={e => onChange({ ...rule, value: `${start || ''}-${e.target.value}` })} style={inputStyle} />
        </div>
      )
    }
    default:
      return null
  }
}

// ── Compact config for a nested "Notify a Collaborator" action ──────────────

function NestedCollabConfig({
  config, onChange, collaborators, collabDocs,
}: {
  config: Record<string, string>
  onChange: (patch: Record<string, string>) => void
  collaborators: Collaborator[]
  collabDocs: DocRef[]
}) {
  const fieldLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }
  const fieldInput: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12.5, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', background: '#fff' }
  const notifType = config.notificationType || 'message'

  return (
    <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: '#fff', border: '1px solid #EDE9FE' }} onClick={e => e.stopPropagation()}>
      <div style={{ marginBottom: 10 }}>
        <label style={fieldLabel}>Collaborator</label>
        {collaborators.length === 0 ? (
          <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
            No collaborators yet. <a href="/settings" style={{ color: '#7C3AED', fontWeight: 600 }}>Add one in Settings</a>
          </div>
        ) : (
          <select value={config.collaboratorId || ''} onChange={e => onChange({ collaboratorId: e.target.value })} style={fieldInput}>
            <option value="">Choose a collaborator…</option>
            {collaborators.map(c => <option key={c.id} value={c.id}>{c.collaborator_name} — {c.relationship}</option>)}
          </select>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={fieldLabel}>Notification type</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {([['message', 'Message'], ['task', 'Task'], ['document', 'Document']] as const).map(([val, label]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}>
              <input type="radio" checked={notifType === val} onChange={() => onChange({ notificationType: val })} style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {notifType === 'message' && (
        <div>
          <label style={fieldLabel}>Message</label>
          <textarea value={config.message || ''} onChange={e => onChange({ message: e.target.value })} rows={3}
            placeholder="e.g. Please follow up with {{client_name}}…"
            style={{ ...fieldInput, resize: 'none', lineHeight: 1.5, marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLLAB_VARIABLES.map(v => (
              <button key={v} type="button" onClick={() => onChange({ message: (config.message || '') + (config.message ? ' ' : '') + v })}
                style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, border: '1px solid #E5E7EB', background: '#F8FAFC', cursor: 'pointer', color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {notifType === 'task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={fieldLabel}>Task title</label>
            <input value={config.taskTitle || ''} onChange={e => onChange({ taskTitle: e.target.value })}
              placeholder="e.g. Follow up with {{client_name}}" style={fieldInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={fieldLabel}>Due</label>
              <select value={config.taskDueRelative || 'in 3 days'} onChange={e => onChange({ taskDueType: 'relative', taskDueRelative: e.target.value })} style={fieldInput}>
                <option value="in 1 day">In 1 day</option>
                <option value="in 3 days">In 3 days</option>
                <option value="in 1 week">In 1 week</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Priority</label>
              <select value={config.taskPriority || 'Medium'} onChange={e => onChange({ taskPriority: e.target.value })} style={fieldInput}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {notifType === 'document' && (
        <div>
          <label style={fieldLabel}>Document</label>
          {collabDocs.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>No notes or proposals to share yet.</div>
          ) : (
            <select value={config.documentRef || ''} onChange={e => onChange({ documentRef: e.target.value })} style={fieldInput}>
              <option value="">Choose a document…</option>
              {collabDocs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          )}
        </div>
      )}
    </div>
  )
}

// ── One lane (When this is true / When this is false) ───────────────────────

function Lane({
  label, tone, actions, onChange, depth, collaborators, collabDocs, onBlockedNesting, emptyHint,
}: {
  label: string
  tone: 'if' | 'else'
  actions: SimpleAction[]
  onChange: (actions: SimpleAction[]) => void
  depth: number
  collaborators: Collaborator[]
  collabDocs: DocRef[]
  onBlockedNesting: () => void
  emptyHint?: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const colors = tone === 'if'
    ? { text: 'var(--accent-brand-hover)', bg: 'rgba(var(--accent-brand-rgb),0.08)', leftBorder: 'var(--accent-brand)', badgeBg: 'var(--accent-brand)', badgeText: '#fff', pillBg: 'rgba(var(--accent-brand-rgb),0.09)', pillBorder: 'rgba(var(--accent-brand-rgb),0.3)' }
    : { text: '#6B7280', bg: 'rgba(107,114,128,0.04)', leftBorder: '#6B7280', badgeBg: '#E5E7EB', badgeText: '#4B5563', pillBg: '#F3F4F6', pillBorder: '#E5E7EB' }

  function addNested(type: string) {
    if (type === 'rule') {
      if (depth >= 1) { onBlockedNesting(); return }
      onChange([...actions, { id: `${Date.now()}`, type: 'rule', rule: defaultRuleConfig() }])
      return
    }
    onChange([...actions, { id: `${Date.now()}`, type, config: {} }])
  }

  function updateNested(id: string, patch: Partial<SimpleAction>) {
    onChange(actions.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  function removeNested(id: string) {
    onChange(actions.filter(a => a.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div style={{ flex: 1, minWidth: 0, background: colors.bg, borderLeft: `3px solid ${colors.leftBorder}`, borderRadius: '4px 12px 12px 4px', padding: 12 }}>
      <span style={{
        display: 'inline-block', fontSize: 11, fontWeight: 700, color: colors.badgeText, background: colors.badgeBg,
        padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-body)', marginBottom: 10,
      }}>
        {label}
      </span>

      {actions.length === 0 && emptyHint && (
        <div style={{ fontSize: 11.5, color: '#9CA3AF', fontStyle: 'italic', fontFamily: 'var(--font-body)', marginBottom: 8, lineHeight: 1.5 }}>
          {emptyHint}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {actions.map(a => {
          const meta = NESTED_ACTION_TYPES.find(t => t.value === a.type)
          const Icon = meta?.icon
          const isCollab = a.type === 'notify-collaborator'
          const isNestedRule = a.type === 'rule' && !!a.rule
          const isExpanded = expandedId === a.id
          return (
            <div key={a.id}>
              <div
                onClick={() => (isCollab || isNestedRule) && setExpandedId(isExpanded ? null : a.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 8,
                  background: isNestedRule ? 'rgba(202,138,4,0.08)' : colors.pillBg,
                  border: `1px solid ${isNestedRule ? 'rgba(202,138,4,0.3)' : colors.pillBorder}`,
                  cursor: (isCollab || isNestedRule) ? 'pointer' : 'default',
                }}
              >
                {isNestedRule ? <GitBranch size={13} color="#CA8A04" /> : Icon ? <Icon size={13} color="#6B7280" /> : null}
                <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', flex: 1, minWidth: 0 }}>
                  {isNestedRule ? 'Nested rule' : (meta?.label || a.type)}
                </span>
                {(isCollab || isNestedRule) && (
                  <ChevronRight size={12} color="#9CA3AF" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                )}
                <button type="button" onClick={e => { e.stopPropagation(); removeNested(a.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}>
                  <X size={12} color="#9CA3AF" />
                </button>
              </div>

              {isCollab && isExpanded && (
                <NestedCollabConfig
                  config={a.config || {}}
                  onChange={patch => updateNested(a.id, { config: { ...(a.config || {}), ...patch } })}
                  collaborators={collaborators}
                  collabDocs={collabDocs}
                />
              )}

              {isNestedRule && isExpanded && a.rule && (
                <div style={{ marginTop: 8 }}>
                  <RuleEditor
                    rule={a.rule}
                    onChange={next => updateNested(a.id, { rule: next })}
                    depth={1}
                    collaborators={collaborators}
                    collabDocs={collabDocs}
                    onBlockedNesting={onBlockedNesting}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {NESTED_ACTION_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => addNested(t.value)} title={t.label}
            style={{
              width: 26, height: 26, borderRadius: 7, border: `1px dashed ${colors.pillBorder}`, background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            <t.icon size={12} color="#9CA3AF" />
          </button>
        ))}
        <button type="button" onClick={() => addNested('rule')} title="Add a rule"
          style={{
            width: 26, height: 26, borderRadius: 7, border: '1px dashed rgba(202,138,4,0.4)', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          <GitBranch size={12} color="#CA8A04" />
        </button>
      </div>
    </div>
  )
}

// ── Main recursive RuleEditor ────────────────────────────────────────────────

export default function RuleEditor({
  rule, onChange, depth, collaborators, collabDocs, onBlockedNesting,
}: {
  rule: RuleConfig
  onChange: (rule: RuleConfig) => void
  depth: number
  collaborators: Collaborator[]
  collabDocs: DocRef[]
  onBlockedNesting: () => void
}) {
  const currentOptionValue = conditionOptionValue(rule.conditionType, rule.operator)
  const bothEmpty = rule.ifActions.length === 0 && rule.elseActions.length === 0

  function setConditionOption(value: string) {
    const opt = CONDITION_OPTIONS.find(o => o.value === value)
    if (!opt) return
    onChange({ ...rule, conditionType: opt.conditionType as ConditionType, operator: opt.operator, value: '' })
  }

  return (
    <div
      className="rule-editor-block"
      style={{
        background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)',
        borderLeft: '4px solid #CA8A04', borderRadius: 12, padding: 16,
      }}
    >
      <style>{`
        @keyframes ruleExpand { from { opacity: 0; transform: scaleY(0.92); } to { opacity: 1; transform: scaleY(1); } }
        @keyframes lanesFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .rule-editor-block { animation: ruleExpand 250ms ease-out; transform-origin: top; }
        .rule-lanes { animation: lanesFadeIn 220ms ease-out 150ms both; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <GitBranch size={14} color="#CA8A04" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E', fontFamily: 'var(--font-body)' }}>
          If this is true…
        </span>
      </div>

      {/* Condition row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={currentOptionValue} onChange={e => setConditionOption(e.target.value)}
          style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', background: '#fff', outline: 'none' }}>
          {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ flex: '1 1 160px' }}>
          <ConditionValueInput rule={rule} onChange={onChange} />
        </div>
      </div>

      {/* Live plain-English preview */}
      <div style={{
        background: 'rgba(var(--accent-brand-rgb),0.03)', borderLeft: '3px solid var(--accent-brand)', borderRadius: '0 8px 8px 0',
        padding: '9px 12px', marginBottom: 14, fontSize: 12.5, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.5,
      }}>
        {buildPlainEnglishSummary(rule)}
      </div>

      {/* Lanes */}
      <div className="rule-lanes" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Lane
          label="When this is true"
          tone="if"
          actions={rule.ifActions}
          onChange={ifActions => onChange({ ...rule, ifActions })}
          depth={depth}
          collaborators={collaborators}
          collabDocs={collabDocs}
          onBlockedNesting={onBlockedNesting}
        />
        <Lane
          label="When this is false"
          tone="else"
          actions={rule.elseActions}
          onChange={elseActions => onChange({ ...rule, elseActions })}
          depth={depth}
          collaborators={collaborators}
          collabDocs={collabDocs}
          onBlockedNesting={onBlockedNesting}
          emptyHint="Leave empty to do nothing when condition is false"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ height: 1, background: 'rgba(107,114,128,0.25)' }} />
        <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, var(--font-body)', marginTop: 6 }}>
          Then continue with…
        </div>
      </div>

      {bothEmpty && (
        <div style={{
          marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.08)',
          fontSize: 11.5, color: '#92400E', fontFamily: 'var(--font-body)', lineHeight: 1.5,
        }}>
          Your condition has no actions in either lane — this agent won&apos;t do anything when the condition fires.
        </div>
      )}
    </div>
  )
}

export { describeActions }
export type { RuleConfig, SimpleAction }
