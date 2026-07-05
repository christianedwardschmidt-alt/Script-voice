import Anthropic from '@anthropic-ai/sdk'
import { execute, queryAll, queryOne } from '@/lib/db'

const anthropic = new Anthropic()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const tools: Anthropic.Tool[] = [
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
      },
      required: ['name', 'company'],
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
          enum: ['dashboard', 'tasks', 'clients', 'crm', 'invoicing', 'calendar', 'ai-assistant', 'settings', 'profile', 'jobs', 'education', 'integrations', 'tax', 'community', 'contact'],
          description: 'The page to navigate to',
        },
      },
      required: ['page'],
    },
  },
]

async function executeTool(name: string, input: AnyRecord): Promise<{ summary: string; data?: AnyRecord }> {
  if (name === 'create_task') {
    const { title, priority = 'medium', dueDate = '', project = '', description = '' } = input
    const r = await execute(
      `INSERT INTO tasks (title, description, priority, status, dueDate, project, integrations, checked) VALUES (?,?,?,?,?,?,?,?)`,
      [title, description, priority, 'todo', dueDate, project, '[]', 0]
    )
    return { summary: `Task created: "${title}"`, data: { id: r.lastInsertRowid, title, priority, dueDate, project } }
  }

  if (name === 'draft_invoice') {
    const { client, project = '', amount, dueDate } = input
    const id = `INV-${String(Math.floor(Math.random() * 900 + 100))}`
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const due = dueDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    await execute(
      `INSERT INTO invoices (id, client, project, amount, status, issued, due, avatar, color) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, client, project, amount, 'Draft', today, due, '👤', '#78716c']
    )
    return { summary: `Invoice ${id} drafted for ${client} — $${Number(amount).toLocaleString()}`, data: { id, client, project, amount, due } }
  }

  if (name === 'add_client') {
    const { name, company, email = '', phone = '' } = input
    const r = await execute(
      `INSERT INTO clients (name, company, email, phone, avatar, color, status, revenue, projects) VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, company, email, phone, '👤', '#78716c', 'active', 0, 0]
    )
    return { summary: `Client added: ${name} at ${company}`, data: { id: r.lastInsertRowid, name, company, email } }
  }

  if (name === 'schedule_event') {
    const { title, date, startTime = null, endTime = null, type = 'meeting', client = null, description = null } = input
    const r = await execute(
      `INSERT INTO calendar_events (title, date, startTime, endTime, type, client, description, color) VALUES (?,?,?,?,?,?,?,?)`,
      [title, date, startTime, endTime, type, client, description, type === 'deadline' ? '#d97706' : '#5b5fcf']
    )
    const dateStr = startTime ? `${date} at ${startTime}` : date
    return { summary: `Scheduled: "${title}" — ${dateStr}`, data: { id: r.lastInsertRowid, title, date, startTime } }
  }

  if (name === 'search_jobs') {
    const { keywords = '', type: jobType = '' } = input
    const jobs = await queryAll(`SELECT title, company, location, budget, type, tags, description FROM jobs LIMIT 8`) as AnyRecord[]
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
      `INSERT INTO crm_clients (name, company, email, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, company, email, stage, value, '👤', '#78716c', '[]', 'Just added', 0, 0, notes]
    )
    return { summary: `CRM contact added: ${name} at ${company} (${stage})`, data: { id: r.lastInsertRowid, name, company, stage, value } }
  }

  if (name === 'navigate_to') {
    const routes: Record<string, string> = {
      dashboard: '/dashboard', tasks: '/tasks', clients: '/clients', crm: '/crm',
      invoicing: '/invoicing', calendar: '/calendar', 'ai-assistant': '/ai-assistant',
      settings: '/settings', profile: '/profile', jobs: '/jobs', education: '/education',
      integrations: '/integrations', tax: '/tax', community: '/community', contact: '/contact',
    }
    const { page } = input
    const url = routes[page] ?? '/dashboard'
    const labels: Record<string, string> = {
      dashboard: 'Dashboard', tasks: 'Tasks', clients: 'Clients', crm: 'CRM Pipeline',
      invoicing: 'Invoicing', calendar: 'Calendar', 'ai-assistant': 'AI Assistant',
      settings: 'Settings', profile: 'Profile', jobs: 'Job Board', education: 'Education',
      integrations: 'Integrations', tax: 'Tax Center', community: 'Community', contact: 'Contact',
    }
    return { summary: `Opening ${labels[page] ?? page}`, data: { url, page } }
  }

  return { summary: 'Action completed' }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const [profile, clients, tasks] = await Promise.all([
    queryOne(`SELECT displayName, skills, headline FROM profile WHERE id = 1`),
    queryAll(`SELECT name, company FROM clients LIMIT 6`),
    queryAll(`SELECT title, status FROM tasks WHERE checked = 0 LIMIT 5`),
  ])

  const p = profile as AnyRecord | null
  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `You are CenterFlo AI — an intelligent assistant that both answers questions AND takes real actions inside this freelance workspace.

User: ${p?.displayName ?? 'Freelancer'} | Skills: ${p?.skills ?? 'Design, Development'}
Clients: ${(clients as AnyRecord[]).map(c => c.name).join(', ') || 'none yet'}
Open tasks: ${(tasks as AnyRecord[]).map(t => t.title).join(', ') || 'none'}
Today: ${today}

When the user asks you to create, add, schedule, draft, find, or do something concrete — use the available tools to actually do it. After using tools, confirm in 1–2 short sentences what you did. For questions, advice, and drafting text content (emails, proposals), respond directly without using tools.

Navigation rule: when the user says "go to", "open", "show", "take me to", or similar for any section — call navigate_to ONCE with the exact destination page. Never use ai-assistant as an intermediate step. Navigate directly to the page the user named.`

  // First call with tools
  const first = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: systemPrompt,
    tools,
    messages: messages.map((m: AnyRecord) => ({ role: m.role, content: m.content })),
  })

  // Execute any tool calls
  const toolResults: Anthropic.ToolResultBlockParam[] = []
  const actionsPerformed: { name: string; summary: string; data?: AnyRecord }[] = []

  for (const block of first.content) {
    if (block.type === 'tool_use') {
      const result = await executeTool(block.name, block.input as AnyRecord)
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      actionsPerformed.push({ name: block.name, summary: result.summary, data: result.data })
    }
  }

  let finalText = first.content.find(b => b.type === 'text')?.text ?? ''

  // If tools were used, get the confirmation response
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

  return Response.json({ text: finalText, actions: actionsPerformed })
}
