// Shared, framework-free logic for the agent builder's rule (conditional branching) feature.
// Safe to import from both client components and server route handlers.

export type ConditionType =
  | 'invoice-amount'
  | 'days-since-contact'
  | 'client-tag'
  | 'proposal-status'
  | 'invoice-status'
  | 'day-of-week'
  | 'time-of-day'

export interface SimpleAction {
  id: string
  type: string
  config?: Record<string, string>
  rule?: RuleConfig
}

export interface RuleConfig {
  conditionType: ConditionType
  operator: 'gt' | 'lt' | 'eq'
  value: string
  ifActions: SimpleAction[]
  elseActions: SimpleAction[]
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const CONDITION_OPTIONS: { value: string; label: string; conditionType: ConditionType; operator: 'gt' | 'lt' | 'eq' }[] = [
  { value: 'invoice-amount:gt', label: 'Invoice amount is greater than', conditionType: 'invoice-amount', operator: 'gt' },
  { value: 'invoice-amount:lt', label: 'Invoice amount is less than', conditionType: 'invoice-amount', operator: 'lt' },
  { value: 'client-tag:eq', label: 'Client has tag', conditionType: 'client-tag', operator: 'eq' },
  { value: 'days-since-contact:gt', label: 'Days since last contact is greater than', conditionType: 'days-since-contact', operator: 'gt' },
  { value: 'days-since-contact:lt', label: 'Days since last contact is less than', conditionType: 'days-since-contact', operator: 'lt' },
  { value: 'proposal-status:eq', label: 'Proposal status is', conditionType: 'proposal-status', operator: 'eq' },
  { value: 'invoice-status:eq', label: 'Invoice status is', conditionType: 'invoice-status', operator: 'eq' },
  { value: 'day-of-week:eq', label: 'Day of week is', conditionType: 'day-of-week', operator: 'eq' },
  { value: 'time-of-day:eq', label: 'Time of day is between', conditionType: 'time-of-day', operator: 'eq' },
]

export const PROPOSAL_STATUS_OPTIONS = ['Accepted', 'Declined', 'Viewed', 'Not Viewed', 'Sent']
export const INVOICE_STATUS_OPTIONS = ['Paid', 'Overdue', 'Pending', 'Partially Paid']

export const ACTION_VERB_PHRASES: Record<string, string> = {
  'send-email': 'send an email',
  'notify-me': 'send yourself a notification',
  'notify-collaborator': 'notify a collaborator',
  'create-task': 'create a task',
  'add-note': 'add a note to the client',
  'update-status': 'update the client status',
  'generate-report': 'generate a report',
  'wait': 'wait then continue',
  'rule': 'check another rule',
}

export function conditionOptionValue(conditionType: ConditionType, operator: string): string {
  return `${conditionType}:${operator}`
}

export function describeCondition(conditionType: ConditionType, operator: string, value: string): string {
  switch (conditionType) {
    case 'invoice-amount':
      return `the invoice is ${operator === 'gt' ? 'over' : 'under'} $${Number(value || 0).toLocaleString()}`
    case 'days-since-contact': {
      const n = Number(value || 0)
      return `it's been ${operator === 'gt' ? 'more' : 'less'} than ${n} day${n === 1 ? '' : 's'} since last contact`
    }
    case 'client-tag':
      return `the client has the tag "${value || '…'}"`
    case 'proposal-status':
      return `the proposal status is ${value || '…'}`
    case 'invoice-status':
      return `the invoice status is ${value || '…'}`
    case 'day-of-week': {
      const days = value ? value.split(',').filter(Boolean) : []
      return days.length ? `today is ${days.join(' or ')}` : 'the day matches'
    }
    case 'time-of-day': {
      const [start, end] = (value || '').split('-')
      return start && end ? `the time is between ${start} and ${end}` : 'the time is in range'
    }
    default:
      return 'the condition is met'
  }
}

export function describeActions(actions: SimpleAction[]): string {
  if (!actions || actions.length === 0) return 'do nothing'
  return actions.map(a => ACTION_VERB_PHRASES[a.type] || a.type).join(' AND ')
}

export function buildPlainEnglishSummary(rule: RuleConfig): string {
  const cond = describeCondition(rule.conditionType, rule.operator, rule.value)
  const ifPart = describeActions(rule.ifActions)
  const elsePart = describeActions(rule.elseActions)
  return `If ${cond} → ${ifPart}. Otherwise → ${elsePart}.`
}

export function findEmptyIfLaneError(actions: SimpleAction[]): string | null {
  for (const a of actions) {
    if (a.type === 'rule' && a.rule) {
      if (a.rule.ifActions.length === 0) return 'Add at least one action to the IF TRUE lane before saving.'
      const nested = findEmptyIfLaneError(a.rule.ifActions) || findEmptyIfLaneError(a.rule.elseActions)
      if (nested) return nested
    }
  }
  return null
}
