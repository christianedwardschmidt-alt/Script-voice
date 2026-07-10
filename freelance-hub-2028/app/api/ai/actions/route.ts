import Anthropic from '@anthropic-ai/sdk'
import { execute, queryAll, queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'

const anthropic = new Anthropic()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

// Shared confidence fields added to every mutating tool
const confidenceFields = {
  confidence: {
    type: 'string' as const,
    enum: ['high', 'medium'] as const,
    description: 'Your confidence interpreting this request. high=all information was explicit in the message; medium=you inferred at least one key detail (client, amount, date). If the request is too vague to interpret safely use request_clarification instead.',
  },
  confidence_reason: {
    type: 'string' as const,
    description: 'Required for medium confidence: exactly what you inferred and from what context (e.g. "I interpreted \'my biggest client\' as Apex Creative based on their $12,400 in revenue this year").',
  },
}

const tools: Anthropic.Tool[] = [
  {
    name: 'request_clarification',
    description: 'Call this — instead of any action tool — when the member\'s request is genuinely too vague to act on safely. Ask one specific question. Do not guess or proceed.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'One specific clarifying question' },
      },
      required: ['question'],
    },
  },
  {
    name: 'create_task',
    description: 'Add a new task to the workspace task list',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
        dueDate: { type: 'string', description: 'Due date e.g. "Jan 20", "Friday"' },
        project: { type: 'string', description: 'Project or client name' },
        description: { type: 'string', description: 'Optional additional detail' },
        ...confidenceFields,
      },
      required: ['title'],
    },
  },
  {
    name: 'draft_invoice',
    description: 'Create a new invoice for a client',
    input_schema: {
      type: 'object',
      properties: {
        client: { type: 'string', description: 'Client name' },
        project: { type: 'string', description: 'Project description' },
        amount: { type: 'number', description: 'Invoice amount in dollars' },
        dueDate: { type: 'string', description: 'Due date e.g. "Jan 30"' },
        ...confidenceFields,
      },
      required: ['client', 'amount'],
    },
  },
  {
    name: 'add_client',
    description: 'Add a new client to the client list',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        company: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        ...confidenceFields,
      },
      required: ['name', 'company'],
    },
  },
  {
    name: 'schedule_event',
    description: 'Add a meeting, deadline, or task to the calendar',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        startTime: { type: 'string', description: 'HH:MM 24h format, optional' },
        endTime: { type: 'string', description: 'HH:MM 24h format, optional' },
        type: { type: 'string', enum: ['meeting', 'deadline', 'task'] },
        client: { type: 'string', description: 'Associated client name, optional' },
        description: { type: 'string' },
        ...confidenceFields,
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'search_jobs',
    description: 'Search available job listings by keywords or type',
    input_schema: {
      type: 'object',
      properties: {
        keywords: { type: 'string', description: 'Skills or role keywords' },
        type: { type: 'string', description: 'Contract, Project, Retainer' },
      },
      required: [],
    },
  },
  {
    name: 'add_crm_contact',
    description: 'Add a prospect or lead to the CRM pipeline',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        company: { type: 'string' },
        email: { type: 'string' },
        stage: { type: 'string', enum: ['Lead', 'Proposal', 'Negotiation', 'Active', 'Completed'] },
        value: { type: 'number', description: 'Estimated deal value in dollars' },
        notes: { type: 'string' },
        ...confidenceFields,
      },
      required: ['name', 'company'],
    },
  },
  {
    name: 'read_notes',
    description: 'Read the user\'s notes to find relevant content, todos, or information. Use when the user asks about their notes, wants to see note content, or wants to convert notes to tasks.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional keyword to filter notes by title or content' },
      },
      required: [],
    },
  },
  {
    name: 'convert_note_to_tasks',
    description: 'Convert bullet points or items from a note into real tasks in the task list. Use when the user says "turn my notes into tasks", "make tasks from my note", "convert this note", or similar. Always call read_notes first to see what notes exist.',
    input_schema: {
      type: 'object',
      properties: {
        note_title: { type: 'string', description: 'Title of the source note (for the confirmation message)' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title extracted from the note' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Inferred priority' },
            },
            required: ['title'],
          },
          description: 'Array of task items to create — extract actionable items from the note content',
        },
        ...confidenceFields,
      },
      required: ['items'],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note in the Notes section',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note body content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
        ...confidenceFields,
      },
      required: ['title'],
    },
  },
  {
    name: 'calculate_late_fee',
    description: 'Look up an overdue invoice and calculate/apply any late fee based on the member\'s late fee settings. Use when the member asks about a late fee, asks you to calculate or apply a late fee, or asks why a fee was added to an invoice.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'Exact invoice ID if known, e.g. INV-4-102' },
        client: { type: 'string', description: 'Client name — used to find their most overdue invoice if invoice_id is not known' },
        ...confidenceFields,
      },
      required: [],
    },
  },
  {
    name: 'navigate_to',
    description: 'Navigate the user to a specific page in the app. Use when the user asks to go to, open, show, or view a section.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['dashboard', 'tasks', 'clients', 'crm', 'invoicing', 'calendar', 'ai-assistant', 'settings', 'profile', 'jobs', 'education', 'integrations', 'tax', 'community', 'contact', 'notes', 'agents', 'transcriptions'],
          description: 'The page to navigate to',
        },
      },
      required: ['page'],
    },
  },
]

// Non-mutating tools don't need confidence indicators
const NO_CONFIDENCE_TOOLS = new Set(['search_jobs', 'read_notes', 'navigate_to', 'request_clarification'])

async function executeTool(name: string, input: AnyRecord, userId: number): Promise<{ summary: string; data?: AnyRecord }> {
  if (name === 'create_task') {
    const { title, priority = 'medium', dueDate = '', project = '', description = '' } = input
    const r = await execute(
      `INSERT INTO tasks (user_id, title, description, priority, status, dueDate, project, integrations, checked) VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId, title, description, priority, 'todo', dueDate, project, '[]', 0]
    )
    return { summary: `Task created: "${title}"`, data: { id: r.lastInsertRowid, title, priority, dueDate, project } }
  }

  if (name === 'draft_invoice') {
    const { client, project = '', amount, dueDate } = input
    const id = `INV-${String(Math.floor(Math.random() * 900 + 100))}`
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const due = dueDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    await execute(
      `INSERT INTO invoices (id, user_id, client, project, amount, status, issued, due, avatar, color) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, userId, client, project, amount, 'Draft', today, due, '👤', '#78716c']
    )
    return { summary: `Invoice ${id} drafted for ${client} — $${Number(amount).toLocaleString()}`, data: { id, client, project, amount, due } }
  }

  if (name === 'add_client') {
    const { name, company, email = '', phone = '' } = input
    const r = await execute(
      `INSERT INTO clients (user_id, name, company, email, phone, avatar, color, status, revenue, projects) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [userId, name, company, email, phone, '👤', '#78716c', 'active', 0, 0]
    )
    return { summary: `Client added: ${name} at ${company}`, data: { id: r.lastInsertRowid, name, company, email } }
  }

  if (name === 'schedule_event') {
    const { title, date, startTime = null, endTime = null, type = 'meeting', client = null, description = null } = input
    const color = type === 'deadline' ? '#d97706' : type === 'task' ? '#00b857' : '#16a34a'
    const r = await execute(
      `INSERT INTO calendar_events (user_id, title, date, startTime, endTime, type, client, description, color) VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId, title, date, startTime, endTime, type, client, description, color]
    )
    const dateStr = startTime ? `${date} at ${startTime}` : date
    return { summary: `Scheduled: "${title}" — ${dateStr}`, data: { id: r.lastInsertRowid, title, date, startTime } }
  }

  if (name === 'search_jobs') {
    const { keywords = '', type: jobType = '' } = input
    const jobs = await queryAll(`SELECT title, company, location, budget, type, tags, description FROM jobs WHERE user_id = ? LIMIT 8`, [userId]) as AnyRecord[]
    const lower = (keywords + ' ' + jobType).toLowerCase()
    const filtered = lower.trim()
      ? jobs.filter(j =>
          j.title?.toLowerCase().includes(lower.split(' ')[0]) ||
          (j.tags as string)?.toLowerCase().includes(lower.split(' ')[0]) ||
          j.type?.toLowerCase() === jobType.toLowerCase()
        )
      : jobs
    const results = filtered.length ? filtered : jobs
    return {
      summary: `Found ${results.length} job${results.length !== 1 ? 's' : ''}`,
      data: { jobs: results.slice(0, 4).map(j => ({ title: j.title, company: j.company, budget: j.budget, type: j.type })) },
    }
  }

  if (name === 'add_crm_contact') {
    const { name, company, email = '', stage = 'Lead', value = 0, notes = '' } = input
    const r = await execute(
      `INSERT INTO crm_clients (user_id, name, company, email, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, name, company, email, stage, value, '👤', '#78716c', '[]', 'Just added', 0, 0, notes]
    )
    return { summary: `CRM contact added: ${name} at ${company} (${stage})`, data: { id: r.lastInsertRowid, name, company, stage, value } }
  }

  if (name === 'read_notes') {
    const { search = '' } = input
    const notes = await queryAll(
      `SELECT id, title, content, tags, pinned, updated_at FROM notes WHERE user_id = ? ORDER BY pinned DESC, updated_at DESC LIMIT 10`,
      [userId]
    ) as AnyRecord[]
    const filtered = search
      ? notes.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()))
      : notes
    const noteList = filtered.map(n => ({
      id: n.id, title: n.title, preview: String(n.content ?? '').slice(0, 300),
      tags: (() => { try { return JSON.parse(n.tags ?? '[]') } catch { return [] } })(),
      pinned: Boolean(n.pinned), updated_at: n.updated_at,
    }))
    return {
      summary: `Found ${noteList.length} note${noteList.length !== 1 ? 's' : ''}${search ? ` matching "${search}"` : ''}`,
      data: { notes: noteList },
    }
  }

  if (name === 'convert_note_to_tasks') {
    const { items = [], note_title = 'note' } = input
    const created: string[] = []
    for (const item of items as AnyRecord[]) {
      const title = String(item.title ?? '').trim()
      if (!title) continue
      await execute(
        `INSERT INTO tasks (user_id, title, description, priority, status, dueDate, project, integrations, checked) VALUES (?,?,?,?,?,?,?,?,?)`,
        [userId, title, `From note: ${note_title}`, item.priority ?? 'medium', 'todo', '', '', '[]', 0]
      )
      created.push(title)
    }
    return {
      summary: `Created ${created.length} task${created.length !== 1 ? 's' : ''} from "${note_title}"`,
      data: { tasks: created },
    }
  }

  if (name === 'create_note') {
    const { title, content = '', tags = [] } = input
    const now = new Date().toISOString()
    const r = await execute(
      `INSERT INTO notes (user_id, title, content, pinned, linked_client, tags, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      [userId, title, content, 0, '', JSON.stringify(tags), now, now]
    )
    return { summary: `Note created: "${title}"`, data: { id: r.lastInsertRowid, title, content } }
  }

  if (name === 'calculate_late_fee') {
    const { invoice_id, client } = input
    let inv: AnyRecord | null = null
    if (invoice_id) {
      inv = await queryOne(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [invoice_id, userId])
    } else if (client) {
      inv = await queryOne(`SELECT * FROM invoices WHERE user_id = ? AND client = ? AND status != 'Paid' ORDER BY due ASC LIMIT 1`, [userId, client])
    } else {
      inv = await queryOne(`SELECT * FROM invoices WHERE user_id = ? AND status = 'Overdue' ORDER BY due ASC LIMIT 1`, [userId])
    }
    if (!inv) return { summary: 'No matching overdue invoice found.', data: {} }

    const dueDate = new Date(inv.due as string)
    const daysPastDue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / 86400000))
    const graceDays = Number(inv.late_fee_grace_days ?? 30)
    const pct = Number(inv.late_fee_percentage ?? 1.5)
    const amount = Number(inv.amount ?? 0)

    if (!inv.late_fee_enabled) {
      return {
        summary: `Late fees aren't enabled on invoice ${inv.id} for ${inv.client}.`,
        data: { invoiceId: inv.id, client: inv.client, lateFeeEnabled: false },
      }
    }
    if (daysPastDue < graceDays) {
      return {
        summary: `Invoice ${inv.id} for ${inv.client} is ${daysPastDue} day${daysPastDue === 1 ? '' : 's'} past due — no late fee yet (grace period is ${graceDays} days).`,
        data: { invoiceId: inv.id, client: inv.client, originalAmount: amount, dueDate: inv.due, daysPastDue, graceDays, feePercentage: pct, feeAmount: 0 },
      }
    }

    const feeAmount = Math.round(amount * (pct / 100) * 100) / 100
    await execute(`UPDATE invoices SET late_fee_applied = 1, late_fee_amount = ? WHERE id = ? AND user_id = ?`, [feeAmount, inv.id, userId])
    return {
      summary: `Late fee applied to invoice ${inv.id} for ${inv.client} — $${feeAmount.toLocaleString()} added (${daysPastDue} days past due)`,
      data: {
        invoiceId: inv.id, client: inv.client, originalAmount: amount, dueDate: inv.due,
        daysPastDue, feePercentage: pct, graceDays, feeAmount, newTotal: Math.round((amount + feeAmount) * 100) / 100,
      },
    }
  }

  if (name === 'navigate_to') {
    const routes: Record<string, string> = {
      dashboard: '/dashboard', tasks: '/tasks', clients: '/clients', crm: '/crm',
      invoicing: '/invoicing', calendar: '/calendar', 'ai-assistant': '/ai-assistant',
      settings: '/settings', profile: '/profile', jobs: '/jobs', education: '/education',
      integrations: '/integrations', tax: '/tax', community: '/community', contact: '/contact',
      notes: '/notes', agents: '/agents', transcriptions: '/transcriptions',
    }
    const { page } = input
    const url = routes[page] ?? '/dashboard'
    const labels: Record<string, string> = {
      dashboard: 'Dashboard', tasks: 'Tasks', clients: 'Clients', crm: 'CRM Pipeline',
      invoicing: 'Invoicing', calendar: 'Calendar', 'ai-assistant': 'AI Assistant',
      settings: 'Settings', profile: 'Profile', jobs: 'Job Board', education: 'Education',
      integrations: 'Integrations', tax: 'Tax Center', community: 'Community', contact: 'Contact',
      notes: 'Notes', agents: 'AI Agents', transcriptions: 'Transcriptions',
    }
    return { summary: `Opening ${labels[page] ?? page}`, data: { url, page } }
  }

  return { summary: 'Action completed' }
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, confirmPendingAction } = await req.json()

  // ── Confirmed pending action: execute directly, skip AI ───────────────────
  if (confirmPendingAction && confirmPendingAction.name !== 'request_clarification') {
    const result = await executeTool(
      confirmPendingAction.name,
      confirmPendingAction.input as AnyRecord,
      user.id
    )
    return Response.json({
      text: result.summary,
      actions: [{ name: confirmPendingAction.name, summary: result.summary, confidence: 'high', data: result.data }],
      pendingAction: null,
      needsClarification: false,
    })
  }

  const [profile, clients, tasks, notes] = await Promise.all([
    queryOne(`SELECT displayName, skills, headline FROM profile WHERE user_id = ?`, [user.id]),
    queryAll(`SELECT name, company, revenue FROM clients WHERE user_id = ? ORDER BY revenue DESC LIMIT 6`, [user.id]),
    queryAll(`SELECT title, status FROM tasks WHERE user_id = ? AND checked = 0 LIMIT 5`, [user.id]),
    queryAll(`SELECT id, title, content FROM notes WHERE user_id = ? ORDER BY pinned DESC, updated_at DESC LIMIT 6`, [user.id]),
  ])

  const p = profile as AnyRecord | null
  const today = new Date().toISOString().split('T')[0]
  const notesSummary = (notes as AnyRecord[]).map(n => `"${n.title}"`).join(', ') || 'none'
  const clientsSummary = (clients as AnyRecord[])
    .map(c => `${c.name} ($${Number(c.revenue ?? 0).toLocaleString()})`)
    .join(', ') || 'none yet'

  const systemPrompt = `You are GuildWire AI — an intelligent assistant that both answers questions AND takes real actions inside this freelance workspace.

User: ${p?.displayName ?? user.name} | Skills: ${p?.skills ?? 'Design, Development'}
Clients (by revenue): ${clientsSummary}
Open tasks: ${(tasks as AnyRecord[]).map(t => t.title).join(', ') || 'none'}
Recent notes: ${notesSummary}
Today: ${today}

When the user asks you to create, add, schedule, draft, find, or do something concrete — use the available tools to actually do it. After using tools, confirm in 1–2 short sentences what you did. For questions, advice, and drafting text content (emails, proposals), respond directly without using tools.

Notes cross-pollination: When the user asks to "turn notes into tasks", "make a task list from my notes", or similar — call read_notes first to get the note content, then call convert_note_to_tasks with the actionable items extracted. When the user asks "what's in my notes" or "show me my notes" — use read_notes and summarize them. You can also create notes from conversations.

Navigation rule: when the user says "go to", "open", "show", "take me to", or similar for any section — call navigate_to ONCE with the exact destination page. Never use ai-assistant as an intermediate step. Navigate directly to the page the user named.

Late fees: when the user asks about a late fee, asks you to calculate or apply one, or asks why a fee showed up on an invoice — call calculate_late_fee with the invoice_id or client name they mentioned.

CONFIDENCE RULES — apply for every request that could trigger an action tool:
• confidence "high": all required information was fully explicit in the member's message — client name stated, amounts stated, dates stated. No guessing. Use this for clear, complete requests.
• confidence "medium": you had to infer at least one key field (which client, what amount, what date) from context data. Set confidence_reason to a precise explanation: "I interpreted 'my biggest client' as Apex Creative based on their $12,400 in revenue this year." The member will be shown your interpretation and asked to confirm — do NOT execute until confirmed. In your text response explain the interpretation naturally: "I interpreted this as [X] because [Y]. Is that right?"
• Request is too vague (you cannot interpret safely): call request_clarification with ONE specific question. Do NOT call any action tool. Do not infer. Do not proceed. Your text response should be the clarifying question.

When a tool returns status "pending_confirmation": explain your interpretation to the member naturally and ask them to confirm.`

  // ── First AI call ─────────────────────────────────────────────────────────
  const first = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: systemPrompt,
    tools,
    messages: messages.map((m: AnyRecord) => ({ role: m.role, content: m.content })),
  })

  const toolResults: Anthropic.ToolResultBlockParam[] = []
  const actionsPerformed: { name: string; summary: string; data?: AnyRecord; confidence: string }[] = []
  let pendingAction: { name: string; input: AnyRecord; interpretation: string } | null = null
  let needsClarification = false

  for (const block of first.content) {
    if (block.type !== 'tool_use') continue

    // ── Clarification requested ─────────────────────────────────────────────
    if (block.name === 'request_clarification') {
      needsClarification = true
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify({ acknowledged: true, instruction: 'State your clarifying question directly as your text response — one sentence.' }),
      })
      continue
    }

    const input = block.input as AnyRecord
    const confidence = String(input.confidence ?? 'high')

    // ── Medium confidence: hold for confirmation ─────────────────────────────
    if (confidence === 'medium' && !NO_CONFIDENCE_TOOLS.has(block.name)) {
      pendingAction = {
        name: block.name,
        input,
        interpretation: String(input.confidence_reason ?? 'I made some inferences about your request.'),
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify({
          status: 'pending_confirmation',
          interpretation: input.confidence_reason,
          instruction: 'Explain your interpretation to the member and ask them to confirm. Be specific about what you inferred.',
        }),
      })
    } else {
      // ── High confidence: execute immediately ────────────────────────────────
      const result = await executeTool(block.name, input, user.id)
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      if (!NO_CONFIDENCE_TOOLS.has(block.name)) {
        actionsPerformed.push({ name: block.name, summary: result.summary, confidence: 'high', data: result.data })
      } else {
        actionsPerformed.push({ name: block.name, summary: result.summary, data: result.data, confidence: 'high' })
      }
    }
  }

  let finalText = first.content.find(b => b.type === 'text')?.text ?? ''

  // ── Second AI call if tools were used ────────────────────────────────────
  if (toolResults.length > 0) {
    const second = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system: systemPrompt,
      tools,
      messages: [
        ...messages.map((m: AnyRecord) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'assistant' as const, content: first.content },
        { role: 'user' as const, content: toolResults },
      ],
    })
    finalText = second.content.find(b => b.type === 'text')?.text ?? ''
  }

  // Fallback text for clarification if AI didn't generate text
  if (needsClarification && !finalText) {
    const clarBlock = first.content.find(b => b.type === 'tool_use' && b.name === 'request_clarification') as Anthropic.ToolUseBlock | undefined
    finalText = clarBlock
      ? String((clarBlock.input as AnyRecord).question ?? 'Could you clarify what you mean?')
      : 'Could you clarify what you mean?'
  }

  return Response.json({
    text: finalText,
    actions: actionsPerformed,
    pendingAction,
    needsClarification,
  })
}
