import { createClient, type InValue, type Row } from '@libsql/client'
import { scryptSync, randomBytes } from 'crypto'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:/tmp/guildwire.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})

// ── Pipeline stage defaults ──────────────────────────────────────────────────

export const DEFAULT_PIPELINE_STAGES = JSON.stringify([
  { id: 'lead',        name: 'Lead',        color: '#6B7280', order: 0 },
  { id: 'proposal',    name: 'Proposal',    color: '#16A34A', order: 1 },
  { id: 'negotiation', name: 'Negotiation', color: '#D97706', order: 2 },
  { id: 'active',      name: 'Active',      color: '#22C55E', order: 3 },
  { id: 'completed',   name: 'Completed',   color: '#14B8A6', order: 4 },
  { id: 'lost',        name: 'Lost',        color: '#EF4444', order: 5 },
])

// ── Row conversion ───────────────────────────────────────────────────────────

function rowToObj(columns: string[], row: Row): Record<string, unknown> {
  return Object.fromEntries(columns.map(col => [col, row[col]]))
}

// ── Public query helpers ─────────────────────────────────────────────────────

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  args?: InValue[]
): Promise<T[]> {
  await ensureReady()
  const r = await client.execute({ sql, args: args ?? [] })
  return r.rows.map(row => rowToObj(r.columns, row)) as unknown as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args?: InValue[]
): Promise<T | null> {
  await ensureReady()
  const r = await client.execute({ sql, args: args ?? [] })
  if (!r.rows.length) return null
  return rowToObj(r.columns, r.rows[0]) as unknown as T
}

export async function execute(
  sql: string,
  args?: InValue[]
): Promise<{ lastInsertRowid: number }> {
  await ensureReady()
  const r = await client.execute({ sql, args: args ?? [] })
  return { lastInsertRowid: Number(r.lastInsertRowid ?? 0) }
}

export function logActivity(userId: number, message: string) {
  client
    .execute({
      sql: 'INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)',
      args: [userId, message, new Date().toISOString()],
    })
    .catch(console.error)
}

export async function restoreSeedData(userId: number): Promise<void> {
  await ensureReady()
  const userTables = ['clients', 'crm_clients', 'tasks', 'invoices', 'calendar_events', 'tax_deductions', 'tax_documents', 'tax_expenses', 'tax_mileage', 'tax_quarterly_payments', 'tax_w9', 'activity_log']
  for (const t of userTables) await client.execute({ sql: `DELETE FROM ${t} WHERE user_id = ?`, args: [userId] })
  await seedClients(userId)
  await seedCrmClients(userId)
  await seedTasks(userId)
  await seedInvoices(userId)
  await seedTaxDeductions(userId)
  await seedTaxDocuments(userId)
  await seedTaxExpenses(userId)
  await seedTaxMileage(userId)
  await seedCalendarEvents(userId)
  await client.execute({
    sql: 'INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)',
    args: [userId, 'Sample data restored', new Date().toISOString()],
  })
}

// Creates minimal defaults for a real new user (no demo data, just catalog + profile)
export async function createUserDefaults(userId: number, name: string, email: string): Promise<void> {
  await ensureReady()
  await client.execute({
    sql: `INSERT OR IGNORE INTO profile (user_id,displayName,email,headline,skills) VALUES (?,?,?,?,?)`,
    args: [userId, name, email, 'Freelancer', ''],
  })
  await client.execute({
    sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName,pipeline_stages) VALUES (?,1,0,0,1,1,?,?)`,
    args: [userId, 'My Studio', DEFAULT_PIPELINE_STAGES],
  })
  await client.execute({
    sql: `INSERT OR IGNORE INTO contact_info (user_id,fullName,email,phone,website,location,timezone,bio) VALUES (?,?,?,?,?,?,?,?)`,
    args: [userId, name, email, '', '', '', 'UTC', ''],
  })
  await client.execute({
    sql: 'INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)',
    args: [userId, 'Welcome to GuildWire — your workspace is ready', new Date().toISOString()],
  })
}

// Seeds catalog items (jobs/courses/integrations/posts) for a user if they have none
export async function ensureUserCatalog(userId: number): Promise<void> {
  await ensureReady()
  const hasJobs = await client.execute({ sql: `SELECT id FROM jobs WHERE user_id = ? LIMIT 1`, args: [userId] })
  if (!hasJobs.rows.length) {
    await seedJobs(userId)
    await seedCourses(userId)
    await seedIntegrations(userId)
    await seedPosts(userId)
  }
}

export async function seedUserData(userId: number, name: string, email: string): Promise<void> {
  await ensureReady()
  await seedClients(userId)
  await seedCrmClients(userId)
  await seedTasks(userId)
  await seedInvoices(userId)
  await seedTaxDeductions(userId)
  await seedTaxDocuments(userId)
  await seedTaxExpenses(userId)
  await seedTaxMileage(userId)
  await seedCalendarEvents(userId)
  await seedActivityLog(userId)
  await seedJobs(userId)
  await seedCourses(userId)
  await seedIntegrations(userId)
  await seedPosts(userId)
  await client.execute({
    sql: `INSERT OR IGNORE INTO profile (user_id,displayName,email,headline,skills) VALUES (?,?,?,?,?)`,
    args: [userId, name, email, 'Freelance Designer & Developer', 'Figma, React, Next.js, TypeScript'],
  })
  await client.execute({
    sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName,pipeline_stages) VALUES (?,1,0,0,1,1,?,?)`,
    args: [userId, 'My Studio', DEFAULT_PIPELINE_STAGES],
  })
  await client.execute({
    sql: `INSERT OR IGNORE INTO contact_info (user_id,fullName,email,phone,website,location,timezone,bio) VALUES (?,?,?,?,?,?,?,?)`,
    args: [userId, name, email, '', '', '', 'UTC', ''],
  })
}

// ── Init singleton ───────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __guildwireInit: Promise<void> | undefined
}

function ensureReady(): Promise<void> {
  if (!globalThis.__guildwireInit) globalThis.__guildwireInit = runInit()
  return globalThis.__guildwireInit
}

async function runInit() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS password_resets (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL, company TEXT NOT NULL, email TEXT, phone TEXT, website TEXT,
        avatar TEXT, color TEXT, status TEXT, revenue INTEGER DEFAULT 0, projects INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS crm_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL, company TEXT NOT NULL, email TEXT, phone TEXT, website TEXT,
        stage TEXT, value INTEGER DEFAULT 0, avatar TEXT, avatarBg TEXT,
        tags TEXT, lastContact TEXT, starred INTEGER DEFAULT 0, rating INTEGER DEFAULT 0, notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL, description TEXT, priority TEXT, status TEXT,
        dueDate TEXT, project TEXT, integrations TEXT, checked INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 0,
        client TEXT NOT NULL, project TEXT,
        amount REAL DEFAULT 0, status TEXT, issued TEXT, due TEXT, avatar TEXT, color TEXT,
        late_fee_enabled INTEGER DEFAULT 0,
        late_fee_percentage REAL DEFAULT 1.5,
        late_fee_grace_days INTEGER DEFAULT 30,
        late_fee_applied INTEGER DEFAULT 0,
        late_fee_amount REAL DEFAULT 0,
        late_fee_waived INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL, company TEXT, location TEXT, type TEXT, budget TEXT, posted TEXT,
        tags TEXT, description TEXT, rating REAL, reviews INTEGER,
        saved INTEGER DEFAULT 0, applied INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL, instructor TEXT, category TEXT, duration TEXT, lessons INTEGER,
        rating REAL, progress INTEGER DEFAULT 0, enrolled INTEGER DEFAULT 0,
        price INTEGER DEFAULT 0, color TEXT, badge TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS integrations (
        id TEXT NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL, desc TEXT, icon TEXT,
        connected INTEGER DEFAULT 0, lastSync TEXT, category TEXT, color TEXT,
        PRIMARY KEY (id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        author TEXT NOT NULL, handle TEXT, role TEXT, avatar TEXT, color TEXT,
        time TEXT, trending INTEGER DEFAULT 0, content TEXT, image TEXT,
        likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, shares INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0, liked INTEGER DEFAULT 0, saved INTEGER DEFAULT 0,
        reposted INTEGER DEFAULT 0, createdAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS profile (
        user_id INTEGER PRIMARY KEY,
        displayName TEXT, email TEXT, headline TEXT, skills TEXT,
        years_experience INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY,
        notifications INTEGER DEFAULT 1, twoFactor INTEGER DEFAULT 0,
        darkMode INTEGER DEFAULT 0, invoiceAutoSend INTEGER DEFAULT 1,
        weeklyDigest INTEGER DEFAULT 1, workspaceName TEXT DEFAULT 'My Studio',
        pipeline_stages TEXT,
        work_start TEXT DEFAULT '09:00', work_end TEXT DEFAULT '18:00',
        work_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
        google_calendar_connected INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS contact_info (
        user_id INTEGER PRIMARY KEY,
        fullName TEXT, email TEXT, phone TEXT, website TEXT, location TEXT, timezone TEXT, bio TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL, amount INTEGER DEFAULT 0, icon TEXT, max INTEGER DEFAULT 0, color TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL, status TEXT, date TEXT, size TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        message TEXT NOT NULL, createdAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL, date TEXT NOT NULL, startTime TEXT, endTime TEXT,
        type TEXT DEFAULT 'meeting', client TEXT, description TEXT, color TEXT DEFAULT '#16a34a'
      )`,
      `CREATE TABLE IF NOT EXISTS tax_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        date TEXT, description TEXT, category TEXT, amount INTEGER DEFAULT 0, notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_mileage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        date TEXT, from_loc TEXT, to_loc TEXT, purpose TEXT, miles REAL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS tax_quarterly_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        quarter TEXT, year INTEGER DEFAULT 2026,
        paid_amount INTEGER DEFAULT 0, paid_date TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_settings (
        user_id INTEGER PRIMARY KEY,
        filing_status TEXT DEFAULT 'Single',
        state TEXT DEFAULT '',
        entity_type TEXT DEFAULT 'Sole Proprietor',
        fiscal_year TEXT DEFAULT 'Calendar Year',
        accountant_email TEXT DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS tax_w9 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        client_name TEXT, status TEXT DEFAULT 'needed'
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        pinned INTEGER DEFAULT 0,
        linked_client TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL DEFAULT '',
        icon TEXT DEFAULT '🤖',
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        trigger_type TEXT DEFAULT '',
        trigger_config TEXT DEFAULT '{}',
        conditions TEXT DEFAULT '[]',
        actions TEXT DEFAULT '[]',
        template_id TEXT DEFAULT '',
        run_count INTEGER DEFAULT 0,
        last_run TEXT,
        marketplace_agent_id INTEGER,
        cloned_at TEXT,
        custom_time_estimate INTEGER DEFAULT 15,
        schedule_type TEXT,
        scheduled_at TEXT,
        recurring_config TEXT,
        calendar_trigger_config TEXT,
        smart_schedule_description TEXT,
        next_run_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agent_schedule_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        scheduled_for TEXT NOT NULL,
        ran_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        skipped_reason TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agent_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'success',
        trigger_event TEXT DEFAULT '',
        action_taken TEXT DEFAULT '',
        human_readable_summary TEXT,
        technical_log TEXT,
        branch_taken TEXT,
        ran_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS marketplace_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_agent_id INTEGER,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Productivity',
        configuration TEXT NOT NULL DEFAULT '{}',
        submitted_by_user_id INTEGER,
        submitted_by_profession TEXT DEFAULT '',
        clone_count INTEGER DEFAULT 0,
        average_rating REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        approved INTEGER DEFAULT 0,
        featured INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        approved_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS marketplace_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marketplace_agent_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(marketplace_agent_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS invoice_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        paid_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS member_behavior_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL,
        pattern_key TEXT NOT NULL DEFAULT '',
        pattern_data TEXT DEFAULT '{}',
        first_detected TEXT NOT NULL,
        last_detected TEXT NOT NULL,
        occurrence_count INTEGER DEFAULT 1,
        suggested INTEGER DEFAULT 0,
        suggestion_dismissed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agent_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL DEFAULT '',
        suggested_agent_name TEXT NOT NULL,
        suggested_agent_description TEXT DEFAULT '',
        suggested_agent_config TEXT DEFAULT '{}',
        pattern_basis TEXT DEFAULT '',
        impact_estimate TEXT DEFAULT '',
        shown_at TEXT,
        companion_shown_at TEXT,
        accepted INTEGER DEFAULT 0,
        dismissed INTEGER DEFAULT 0,
        created_agent_id INTEGER,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS marketplace_clone_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marketplace_agent_id INTEGER NOT NULL,
        user_id INTEGER,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        collaborator_name TEXT NOT NULL,
        collaborator_email TEXT NOT NULL,
        collaborator_user_id INTEGER,
        relationship TEXT NOT NULL DEFAULT 'Other',
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS collaborator_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_run_id INTEGER,
        collaborator_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'message',
        message TEXT DEFAULT '',
        task_title TEXT DEFAULT '',
        task_due_date TEXT,
        task_priority TEXT DEFAULT '',
        delivered_at TEXT,
        delivery_method TEXT DEFAULT 'email',
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL DEFAULT 'Untitled Proposal',
        client_id INTEGER,
        client_name TEXT DEFAULT '',
        client_email TEXT DEFAULT '',
        project_type TEXT DEFAULT 'Consulting',
        status TEXT NOT NULL DEFAULT 'draft',
        valid_until TEXT,
        share_token TEXT UNIQUE,
        view_count INTEGER DEFAULT 0,
        last_viewed_at TEXT,
        introduction TEXT DEFAULT '',
        problem TEXT DEFAULT '',
        solution TEXT DEFAULT '',
        deliverables TEXT DEFAULT '[]',
        milestones TEXT DEFAULT '[]',
        line_items TEXT DEFAULT '[]',
        payment_terms TEXT DEFAULT 'upon_completion',
        about_me TEXT DEFAULT '',
        terms TEXT DEFAULT '',
        subtotal REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        sent_at TEXT,
        accepted_at TEXT,
        declined_at TEXT,
        accepted_by TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS proposal_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        viewed_at TEXT DEFAULT (datetime('now')),
        time_spent INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS news_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '',
        source_url TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Freelancing',
        published_at TEXT NOT NULL,
        read_time INTEGER DEFAULT 3
      )`,
      `CREATE TABLE IF NOT EXISTS news_briefings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL DEFAULT '',
        generated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS news_bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        article_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, article_id)
      )`,
      `CREATE TABLE IF NOT EXISTS news_preferences (
        user_id INTEGER PRIMARY KEY,
        industries TEXT DEFAULT '[]',
        topics TEXT DEFAULT '[]',
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        slug TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL DEFAULT 'Practical',
        excerpt TEXT DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        featured INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        publish_date TEXT,
        meta_title TEXT DEFAULT '',
        meta_description TEXT DEFAULT '',
        read_time INTEGER DEFAULT 5,
        author_name TEXT DEFAULT 'Christian Monteiro',
        author_title TEXT DEFAULT 'Founder of GuildWire',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS blog_bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, post_id)
      )`,
      `CREATE TABLE IF NOT EXISTS blog_reading_progress (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        progress REAL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY(user_id, post_id)
      )`,
      `CREATE TABLE IF NOT EXISTS recurring_invoice_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        client_name TEXT NOT NULL,
        client_email TEXT DEFAULT '',
        project TEXT DEFAULT '',
        line_items TEXT DEFAULT '[]',
        subtotal REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        total REAL DEFAULT 0,
        amount_mode TEXT NOT NULL DEFAULT 'fixed',
        frequency TEXT NOT NULL DEFAULT 'monthly',
        custom_interval INTEGER DEFAULT 1,
        custom_period TEXT DEFAULT 'months',
        start_date TEXT NOT NULL,
        end_condition TEXT NOT NULL DEFAULT 'indefinite',
        end_after_occurrences INTEGER,
        end_date TEXT,
        send_time TEXT NOT NULL DEFAULT '09:00',
        next_send_date TEXT NOT NULL,
        total_sends INTEGER DEFAULT 0,
        client_notification_enabled INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        avatar TEXT DEFAULT '👤',
        color TEXT DEFAULT '#16a34a',
        last_presend_notified_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS recurring_invoice_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        invoice_id TEXT,
        scheduled_date TEXT NOT NULL,
        sent_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT DEFAULT '',
        retry_count INTEGER DEFAULT 0,
        retry_at TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        href TEXT DEFAULT '',
        read INTEGER DEFAULT 0,
        meta TEXT DEFAULT '{}',
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS email_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        to_email TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '',
        body_html TEXT NOT NULL DEFAULT '',
        related_type TEXT DEFAULT '',
        related_id TEXT DEFAULT '',
        status TEXT DEFAULT 'sent',
        sent_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS tax_income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source TEXT DEFAULT 'recurring_invoice',
        category TEXT DEFAULT 'Recurring Client Income',
        client_name TEXT DEFAULT '',
        invoice_id TEXT DEFAULT '',
        amount REAL DEFAULT 0,
        date_received TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS why_click_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    'write'
  )

  // Schema migrations for existing deployments
  const migrations = [
    `ALTER TABLE clients ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE crm_clients ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tasks ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tax_deductions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tax_documents ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE activity_log ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE calendar_events ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE settings ADD COLUMN workspaceName TEXT DEFAULT 'My Studio'`,
    `ALTER TABLE settings ADD COLUMN pipeline_stages TEXT`,
    `ALTER TABLE jobs ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE integrations ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tax_documents ADD COLUMN category TEXT DEFAULT 'Other Tax Documents'`,
    `ALTER TABLE invoices ADD COLUMN late_fee_enabled INTEGER DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN late_fee_percentage REAL DEFAULT 1.5`,
    `ALTER TABLE invoices ADD COLUMN late_fee_grace_days INTEGER DEFAULT 30`,
    `ALTER TABLE invoices ADD COLUMN late_fee_applied INTEGER DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN late_fee_amount REAL DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN late_fee_waived INTEGER DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN recurring_template_id INTEGER`,
    `ALTER TABLE invoices ADD COLUMN awaiting_amount INTEGER DEFAULT 0`,
    `ALTER TABLE profile ADD COLUMN years_experience INTEGER DEFAULT 0`,
    `ALTER TABLE agent_runs ADD COLUMN human_readable_summary TEXT`,
    `ALTER TABLE agent_runs ADD COLUMN technical_log TEXT`,
    `ALTER TABLE agents ADD COLUMN marketplace_agent_id INTEGER`,
    `ALTER TABLE agents ADD COLUMN cloned_at TEXT`,
    `ALTER TABLE agents ADD COLUMN custom_time_estimate INTEGER DEFAULT 15`,
    `ALTER TABLE agent_runs ADD COLUMN branch_taken TEXT`,
    `ALTER TABLE agents ADD COLUMN schedule_type TEXT`,
    `ALTER TABLE agents ADD COLUMN scheduled_at TEXT`,
    `ALTER TABLE agents ADD COLUMN recurring_config TEXT`,
    `ALTER TABLE agents ADD COLUMN calendar_trigger_config TEXT`,
    `ALTER TABLE agents ADD COLUMN smart_schedule_description TEXT`,
    `ALTER TABLE agents ADD COLUMN next_run_at TEXT`,
    `ALTER TABLE settings ADD COLUMN work_start TEXT DEFAULT '09:00'`,
    `ALTER TABLE settings ADD COLUMN work_end TEXT DEFAULT '18:00'`,
    `ALTER TABLE settings ADD COLUMN work_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'`,
    `ALTER TABLE settings ADD COLUMN google_calendar_connected INTEGER DEFAULT 0`,
  ]
  for (const m of migrations) await client.execute(m).catch(() => {})

  // Seed global news articles (not per-user) once
  const hasNews = await client.execute({ sql: `SELECT id FROM news_articles LIMIT 1`, args: [] })
  if (!hasNews.rows.length) await seedNewsArticles()

  // Seed blog posts once
  const hasBlog = await client.execute({ sql: `SELECT id FROM blog_posts LIMIT 1`, args: [] })
  if (!hasBlog.rows.length) await seedBlogPosts()

  // Seed marketplace agents once
  const hasMarketplace = await client.execute({ sql: `SELECT id FROM marketplace_agents LIMIT 1`, args: [] })
  if (!hasMarketplace.rows.length) await seedMarketplaceAgents()

  // Ensure demo user exists and has data
  const DEMO_EMAIL = 'demo@guildwire.io'
  const demoRows = await client.execute({ sql: `SELECT id FROM users WHERE email = ?`, args: [DEMO_EMAIL] })

  if (!demoRows.rows.length) {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync('demo1234', salt, 64)
    const passwordHash = `${salt}:${hash.toString('hex')}`
    const result = await client.execute({
      sql: `INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      args: [DEMO_EMAIL, 'Demo User', passwordHash, new Date().toISOString()],
    })
    const demoId = Number(result.lastInsertRowid)
    await seedClients(demoId)
    await seedCrmClients(demoId)
    await seedTasks(demoId)
    await seedInvoices(demoId)
    await seedTaxExpenses(demoId)
    await seedTaxMileage(demoId)
    await seedTaxDeductions(demoId)
    await seedTaxDocuments(demoId)
    await seedCalendarEvents(demoId)
    await seedJobs(demoId)
    await seedCourses(demoId)
    await seedIntegrations(demoId)
    await seedPosts(demoId)
    await seedNotes(demoId)
    await seedAgents(demoId)
    await seedProposals(demoId)
    await client.execute({
      sql: `INSERT OR IGNORE INTO profile (user_id,displayName,email,headline,skills) VALUES (?,?,?,?,?)`,
      args: [demoId, 'Alex Rivera', DEMO_EMAIL, 'Product Designer & Full-Stack Developer', 'Figma, React, Next.js, TypeScript, UI/UX, Branding'],
    })
    await client.execute({
      sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName,pipeline_stages) VALUES (?,1,0,0,1,1,?,?)`,
      args: [demoId, 'My Studio', DEFAULT_PIPELINE_STAGES],
    })
    await client.execute({
      sql: `INSERT OR IGNORE INTO contact_info (user_id,fullName,email,phone,website,location,timezone,bio) VALUES (?,?,?,?,?,?,?,?)`,
      args: [demoId, 'Demo User', DEMO_EMAIL, '', '', '', 'UTC', ''],
    })
    await client.execute({
      sql: 'INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)',
      args: [demoId, 'Welcome to GuildWire — your workspace is ready', new Date().toISOString()],
    })
  } else {
    const demoId = Number((demoRows.rows[0] as { id: unknown }).id)

    // Re-seed catalog data if missing
    const hasJobs = await client.execute({ sql: `SELECT id FROM jobs WHERE user_id = ? LIMIT 1`, args: [demoId] })
    if (!hasJobs.rows.length) {
      await seedJobs(demoId)
      await seedCourses(demoId)
      await seedIntegrations(demoId)
      await seedPosts(demoId)
    }

    // Re-seed transactional data if demo still has old sparse invoices
    const paidRes = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM invoices WHERE user_id = ? AND status = 'Paid'`, args: [demoId] })
    const paidCount = Number((paidRes.rows[0] as { cnt: unknown }).cnt)
    if (paidCount < 5) {
      await client.execute({ sql: `DELETE FROM invoices WHERE user_id = ?`, args: [demoId] })
      await client.execute({ sql: `DELETE FROM tax_expenses WHERE user_id = ?`, args: [demoId] })
      await client.execute({ sql: `DELETE FROM tax_mileage WHERE user_id = ?`, args: [demoId] })
      await client.execute({ sql: `DELETE FROM clients WHERE user_id = ?`, args: [demoId] })
      await client.execute({ sql: `DELETE FROM crm_clients WHERE user_id = ?`, args: [demoId] })
      await seedInvoices(demoId)
      await seedTaxExpenses(demoId)
      await seedTaxMileage(demoId)
      await seedClients(demoId)
      await seedCrmClients(demoId)
    }

    // Update profile name if still showing placeholder
    await client.execute({
      sql: `UPDATE profile SET displayName = ?, headline = ?, skills = ? WHERE user_id = ? AND displayName IN ('Demo User','')`,
      args: ['Alex Rivera', 'Product Designer & Full-Stack Developer', 'Figma, React, Next.js, TypeScript, UI/UX, Branding', demoId],
    })
  }
}

// ── Seed functions ───────────────────────────────────────────────────────────

async function seedClients(userId: number) {
  const sql = `INSERT INTO clients (user_id,name,company,email,phone,website,avatar,color,status,revenue,projects) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Emma Thompson','Acme Corp','emma@acmecorp.com','+1 (555) 234-5678','acmecorp.com','👩🏻‍💼','#16a34a','active',44600,7] },
    { sql, args: [userId,'Carlos Mendez','DataSync','carlos@datasync.io','+1 (555) 567-8901','datasync.io','👨🏽‍💼','#14b8a6','active',32800,5] },
    { sql, args: [userId,'Sophie Laurent','NovaBuild','sophie@novabuild.fr','+33 1 23 45 67 89','novabuild.fr','👩🏻‍🎨','#8b5cf6','active',24700,3] },
    { sql, args: [userId,'James Park','Hencewood Digital','james@hencewood.io','+1 (555) 345-6789','hencewood.io','👨🏻‍💻','#ec4899','active',19400,4] },
    { sql, args: [userId,'Aisha Williams','Margono Studio','aisha@margono.co','+1 (555) 456-7890','margono.co','👩🏿‍💼','#f59e0b','active',14600,4] },
  ], 'write')
}

async function seedCrmClients(userId: number) {
  const sql = `INSERT INTO crm_clients (user_id,name,company,email,phone,website,stage,value,avatar,avatarBg,tags,lastContact,starred,rating,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Emma Thompson','Acme Corp','emma@acmecorp.com','+1 (555) 234-5678','acmecorp.com','Active',36000,'👩🏻‍💼','#16a34a',JSON.stringify(['Design','Retainer','Priority']),'15m ago',1,5,'On retainer since Jan. Pays within 3 days. Expanding to native mobile — huge upsell opportunity.'] },
    { sql, args: [userId,'Carlos Mendez','DataSync','carlos@datasync.io','+1 (555) 567-8901','datasync.io','Active',28000,'👨🏽‍💼','#14b8a6',JSON.stringify(['Development','Data','Premium']),'2h ago',1,5,'Best engineering client. Analytics v2 in review — invoice going out this week.'] },
    { sql, args: [userId,'Sophie Laurent','NovaBuild','sophie@novabuild.fr','+33 1 23 45 67 89','novabuild.fr','Negotiation',42000,'👩🏻‍🎨','#8b5cf6',JSON.stringify(['Mobile','Enterprise','Hot']),'1d ago',1,4,'Phase 2 contract circulating for signatures. Largest single contract this year if it closes.'] },
    { sql, args: [userId,'James Park','Hencewood Digital','james@hencewood.io','+1 (555) 345-6789','hencewood.io','Proposal',19500,'👨🏻‍💻','#ec4899',JSON.stringify(['Development','Proposal']),'4h ago',0,4,'Revised proposal sent. They loved the interactive prototype. Expecting sign-off Thursday.'] },
    { sql, args: [userId,'Raj Patel','TechFlow Inc','raj@techflow.io','+1 (555) 678-9012','techflow.io','Lead',58000,'👨🏽‍💻','#6366f1',JSON.stringify(['Enterprise','SaaS','Dream Client']),'3h ago',1,3,'Referral from Carlos. SaaS dashboard from scratch — 4-month engagement. Discovery call booked Jul 14.'] },
    { sql, args: [userId,'Aisha Williams','Margono Studio','aisha@margono.co','+1 (555) 456-7890','margono.co','Completed',14600,'👩🏿‍💼','#f59e0b',JSON.stringify(['Design','Brand','Completed']),'1w ago',0,5,'Brand identity delivered and loved. Left a 5-star review. Following up re: web redesign.'] },
  ], 'write')
}

async function seedTasks(userId: number) {
  const sql = `INSERT INTO tasks (user_id,title,description,priority,status,dueDate,project,integrations,checked) VALUES (?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Finalize DataSync Analytics v2 screens','Complete all dashboard mockups for client review before Friday','high','in progress','Jul 11','DataSync',JSON.stringify(['figma','slack']),0] },
    { sql, args: [userId,'Send NovaBuild Phase 2 contract','Prepare and send updated statement of work with revised scope','high','todo','Jul 12','NovaBuild',JSON.stringify(['notion','slack']),0] },
    { sql, args: [userId,'Discovery call prep — TechFlow Inc','Research their SaaS product and prepare 10 discovery questions','medium','todo','Jul 14','TechFlow Inc',JSON.stringify(['notion']),0] },
    { sql, args: [userId,'Add NovaBuild case study to portfolio','Write up Mobile App v1 project with results and visuals','low','todo','Jul 20','Personal',JSON.stringify([]),0] },
  ], 'write')
}

async function seedInvoices(userId: number) {
  const sql = `INSERT INTO invoices (id,user_id,client,project,amount,status,issued,due,avatar,color) VALUES (?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [`INV-${userId}-081`,userId,'Acme Corp','Design System v2',7200,'Paid','Jan 10','Feb 10','👩🏻‍💼','#16a34a'] },
    { sql, args: [`INV-${userId}-082`,userId,'DataSync','Analytics Dashboard',9400,'Paid','Feb 14','Mar 14','👨🏽‍💼','#14b8a6'] },
    { sql, args: [`INV-${userId}-083`,userId,'Margono Studio','Brand Identity',8100,'Paid','Mar 7','Apr 7','👩🏿‍💼','#f59e0b'] },
    { sql, args: [`INV-${userId}-084`,userId,'Acme Corp','Product Design Sprint',11200,'Paid','Apr 18','May 18','👩🏻‍💼','#16a34a'] },
    { sql, args: [`INV-${userId}-085`,userId,'Hencewood Digital','Platform UI',10800,'Paid','May 9','Jun 9','👨🏻‍💻','#ec4899'] },
    { sql, args: [`INV-${userId}-086`,userId,'NovaBuild','Mobile App v1',13500,'Paid','Jun 25','Jul 25','👩🏻‍🎨','#8b5cf6'] },
    { sql, args: [`INV-${userId}-087`,userId,'Acme Corp','Q3 Retainer',8400,'Paid','Jul 2','Aug 2','👩🏻‍💼','#16a34a'] },
    { sql, args: [`INV-${userId}-088`,userId,'DataSync','Analytics v2',9800,'Pending','Jul 15','Aug 15','👨🏽‍💼','#14b8a6'] },
    { sql, args: [`INV-${userId}-089`,userId,'NovaBuild','Phase 2 Features',6200,'Pending','Jul 22','Aug 22','👩🏻‍🎨','#8b5cf6'] },
    { sql, args: [`INV-${userId}-090`,userId,'TechFlow Inc','SaaS Dashboard',14500,'Draft','Jul 25','Aug 25','👨🏽‍💻','#6366f1'] },
  ], 'write')
}

async function seedJobs(userId: number) {
  const sql = `INSERT INTO jobs (user_id,title,company,location,type,budget,posted,tags,description,rating,reviews,saved,applied) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Senior UI/UX Designer','Stripe','Remote','Contract','$120–160/hr','2h ago',JSON.stringify(['Figma','Design Systems','React']),'Looking for an experienced designer to lead our dashboard redesign. 3-month engagement.',4.9,24,0,0] },
    { sql, args: [userId,'Full Stack Next.js Developer','Vercel','Remote','Project','$18,000 fixed','5h ago',JSON.stringify(['Next.js','TypeScript','PostgreSQL']),'Build a SaaS analytics platform from scratch. Solo project, 2 months timeline.',4.7,18,1,0] },
    { sql, args: [userId,'Brand Identity Designer','Linear','Hybrid','Contract','$90–110/hr','1d ago',JSON.stringify(['Branding','Illustration','Motion']),'Refreshing our brand identity. Need a creative who understands B2B SaaS.',4.8,31,0,0] },
    { sql, args: [userId,'React Native Developer','Notion','Remote','Retainer','$8,500/mo','2d ago',JSON.stringify(['React Native','iOS','Android']),'Ongoing mobile app development. 20 hrs/week retainer arrangement.',5.0,12,0,0] },
  ], 'write')
}

async function seedCourses(userId: number) {
  const sql = `INSERT INTO courses (user_id,title,instructor,category,duration,lessons,rating,progress,enrolled,price,color,badge) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Advanced Figma for Freelancers','Sarah Chen','Design','8h 30m',42,4.9,65,1,0,'#16a34a','Free'] },
    { sql, args: [userId,'Full-Stack Next.js','Marcus Williams','Development','22h',95,4.8,30,1,79,'#10b981','Bestseller'] },
    { sql, args: [userId,'AI Tools for Freelancers','Priya Sharma','AI & ML','6h 45m',28,4.9,0,0,49,'#f59e0b','New'] },
    { sql, args: [userId,'Freelance Business Mastery','James Rodriguez','Business','11h',56,4.7,100,1,89,'#ec4899',null] },
    { sql, args: [userId,'UX Research & Testing','Aisha Johnson','Design','9h',38,4.8,0,0,59,'#06b6d4','Popular'] },
    { sql, args: [userId,'Content Marketing','Tom Blake','Marketing','7h 50m',33,4.6,0,0,39,'#78716c',null] },
  ], 'write')
}

async function seedIntegrations(userId: number) {
  const sql = `INSERT OR IGNORE INTO integrations (id,user_id,name,desc,icon,connected,lastSync,category,color) VALUES (?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['ms365',userId,'Microsoft 365','Word, Excel, PowerPoint, Outlook & Teams','🪟',1,'2 min ago','Productivity','#0078d4'] },
    { sql, args: ['notion',userId,'Notion','All-in-one workspace for notes and docs','◼',1,'5 min ago','Productivity','#1c1917'] },
    { sql, args: ['slack',userId,'Slack','Team communication and collaboration','💬',1,'1 min ago','Productivity','#4a154b'] },
    { sql, args: ['figma',userId,'Figma','Collaborative design and prototyping','🎨',1,'10 min ago','Design','#f24e1e'] },
    { sql, args: ['adobe',userId,'Adobe Creative Cloud','Photoshop, Illustrator, XD & more','🔴',0,null,'Design','#ff0000'] },
    { sql, args: ['github',userId,'GitHub','Version control and code collaboration','🐙',1,'3 min ago','Development','#1c1917'] },
    { sql, args: ['vscode',userId,'VS Code','Code editor with extensions and sync','💙',1,'15 min ago','Development','#007acc'] },
    { sql, args: ['vercel',userId,'Vercel','Frontend deployment and edge network','▲',0,null,'Development','#1c1917'] },
    { sql, args: ['stripe',userId,'Stripe','Payment processing and subscriptions','💳',1,'1 min ago','Finance','#6772e5'] },
    { sql, args: ['wise',userId,'Wise','International transfers and multi-currency','🌍',1,'20 min ago','Finance','#9fe870'] },
    { sql, args: ['quickbooks',userId,'QuickBooks','Accounting software for freelancers','📊',0,null,'Finance','#2ca01c'] },
    { sql, args: ['canva',userId,'Canva','Quick design tool for social media','🖼',0,null,'Design','#00c4cc'] },
  ], 'write')
}

async function seedPosts(userId: number) {
  const sql = `INSERT INTO posts (user_id,author,handle,role,avatar,color,time,trending,content,image,likes,comments,shares,views,liked,saved,reposted,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  const now = Date.now()
  await client.batch([
    { sql, args: [userId,'Sarah Johnson','@sarahj_ux','Senior UI/UX Designer','👩🏻‍🎨','#16a34a','2h',1,'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off.\n\nHere\'s what worked for me:\n→ Niching down to SaaS dashboards only\n→ Cold outreach with a custom Loom video\n→ Packaging services at 3 clear price points\n\nThe journey is everything. Keep going. 💜',JSON.stringify({type:'design',label:'Dashboard Redesign Preview',emoji:'🖥',grad:'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)'}),142,38,21,8400,0,0,0,new Date(now - 2*3600000).toISOString()] },
    { sql, args: [userId,'Marcus Williams','@marcusdev','Full Stack Developer','👨🏾‍💻','#10b981','5h',0,'Hot take: The single best thing I did for my freelance career was raising my rates.\n\nWent from $85/hr → $150/hr and actually got MORE serious clients.\n\nPrice is a signal. Premium pricing filters out problem clients automatically.',JSON.stringify({type:'chart',label:'Revenue Growth 2025→2026',emoji:'📈',grad:'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)'}),287,64,89,21300,1,0,0,new Date(now - 5*3600000).toISOString()] },
    { sql, args: [userId,'Priya Sharma','@priya_uxr','UX Researcher','👩🏽‍💻','#f59e0b','1d',0,'Sharing my freelance contract template — took me 2 years and one bad client experience to get right.\n\nIncludes:\n✅ Scope of work clauses\n✅ Revision limits\n✅ Kill fee (25% if client cancels)\n✅ IP ownership on final payment',null,512,97,203,34100,0,1,0,new Date(now - 24*3600000).toISOString()] },
    { sql, args: [userId,'Tom Blake','@tomblake_brand','Brand Strategist','👨🏼‍💼','#06b6d4','2d',0,'My home office setup after 3 years of freelancing. The monitor arm was a game changer. 🖥\n\nTools I swear by:\n• Standing desk (health investment)\n• Good mic (clients notice)\n• Notion + GuildWire for project tracking',JSON.stringify({type:'photo',label:'Home Office Setup',emoji:'🖥',grad:'linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)'}),94,41,7,5200,0,0,1,new Date(now - 48*3600000).toISOString()] },
  ], 'write')
}

async function seedTaxDeductions(userId: number) {
  const sql = `INSERT INTO tax_deductions (user_id,category,amount,icon,max,color) VALUES (?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'Home Office',3600,'🏠',5400,'#16a34a'] },
    { sql, args: [userId,'Software & Tools',2840,'💻',5400,'#ec4899'] },
    { sql, args: [userId,'Health Insurance',5400,'🏥',5400,'#10b981'] },
    { sql, args: [userId,'Equipment',4100,'🖥',5400,'#f59e0b'] },
    { sql, args: [userId,'Education',1200,'📚',5400,'#06b6d4'] },
    { sql, args: [userId,'Internet & Phone',960,'📡',5400,'#78716c'] },
  ], 'write')
}

async function seedTaxExpenses(userId: number) {
  const sql = `INSERT INTO tax_expenses (user_id,date,description,category,amount,notes) VALUES (?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'2026-01-15','Adobe Creative Cloud subscription','Software & Subscriptions',55,''] },
    { sql, args: [userId,'2026-01-20','Rent – home office portion (20% of $2,400)','Home Office',480,'Based on 20% home office use'] },
    { sql, args: [userId,'2026-02-03','New 4K monitor','Equipment & Technology',429,'Dell UltraSharp – used exclusively for work'] },
    { sql, args: [userId,'2026-02-18','Notion Pro annual','Software & Subscriptions',192,'Project management & docs'] },
    { sql, args: [userId,'2026-03-05','Flight to NYC – client kickoff','Travel & Transportation',380,'Roundtrip JFK – Apex Creative onboarding'] },
    { sql, args: [userId,'2026-03-18','Client lunch – Foundry Labs','Meals & Entertainment',94,'50% deductible – business lunch'] },
    { sql, args: [userId,'2026-04-01','LinkedIn Premium','Marketing & Advertising',40,''] },
    { sql, args: [userId,'2026-04-10','Next.js conference ticket','Professional Development',299,'Next.js Conf 2026'] },
    { sql, args: [userId,'2026-04-20','Health insurance premium (April)','Health Insurance Premiums',380,'Self-employed health insurance'] },
    { sql, args: [userId,'2026-05-01','Internet service – business portion (80%)','Software & Subscriptions',80,'$100/mo × 80%'] },
    { sql, args: [userId,'2026-05-15','Health insurance premium (May)','Health Insurance Premiums',380,''] },
    { sql, args: [userId,'2026-05-28','Figma Professional – annual','Software & Subscriptions',144,'Design tool'] },
    { sql, args: [userId,'2026-06-10','Hotel – client on-site week','Travel & Transportation',840,'4 nights – Meridian Co project'] },
    { sql, args: [userId,'2026-06-20','Health insurance premium (June)','Health Insurance Premiums',380,''] },
    { sql, args: [userId,'2026-07-01','SEP-IRA contribution (Q2)','Retirement Contributions',2000,'Quarterly SEP-IRA deposit'] },
  ], 'write')
}

async function seedTaxMileage(userId: number) {
  const sql = `INSERT INTO tax_mileage (user_id,date,from_loc,to_loc,purpose,miles) VALUES (?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'2026-01-22','Home','Apex Creative office','Project kickoff meeting',24] },
    { sql, args: [userId,'2026-02-11','Home','Post office + FedEx','Mail signed contracts',6] },
    { sql, args: [userId,'2026-03-08','Home','Downtown coworking space','Client presentation',13] },
    { sql, args: [userId,'2026-04-14','Home','Foundry Labs HQ','Design review session',19] },
    { sql, args: [userId,'2026-05-03','Home','Office Depot + client office','Supplies + meeting',28] },
    { sql, args: [userId,'2026-06-17','Home','Meridian Co. office','Monthly check-in',31] },
    { sql, args: [userId,'2026-07-02','Home','Bank + accountant office','Q2 tax payment + CPA meeting',15] },
  ], 'write')
}

async function seedTaxDocuments(userId: number) {
  const sql = `INSERT INTO tax_documents (user_id,name,status,date,size,category) VALUES (?,?,?,?,?,?)`
  await client.batch([
    { sql, args: [userId,'1099-NEC (Tech Trophey)','Received','Jan 5','48 KB','1099s Received'] },
    { sql, args: [userId,'1099-NEC (Hencewood)','Received','Jan 8','52 KB','1099s Received'] },
    { sql, args: [userId,'Schedule C Draft','In Progress','Jan 12','—','Other Tax Documents'] },
    { sql, args: [userId,'2023 Tax Return','Filed','Apr 12','210 KB','Prior Year Returns'] },
    { sql, args: [userId,'W-9 Form (Emma Thompson)','Filed','Mar 1','28 KB','W-9s Collected'] },
    { sql, args: [userId,'Q1 2026 Estimated Payment Receipt','Received','Apr 15','14 KB','Quarterly Payment Receipts'] },
  ], 'write')
}

async function seedAgents(userId: number) {
  const now = new Date()
  const d = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()
  const agentSql = `INSERT INTO agents (user_id,name,icon,description,status,trigger_type,trigger_config,conditions,actions,template_id,run_count,last_run,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  const a1 = await client.execute({
    sql: agentSql,
    args: [userId,'Follow-up Email Agent','✉️','Sends a follow-up email to prospects who haven\'t responded in 3 days','active','schedule','{"frequency":"daily","time":"09:00"}','[]','[{"type":"send-email","to":"client"}]','followup-email',47,d(2),d(72*3),d(2)],
  })
  const a2 = await client.execute({
    sql: agentSql,
    args: [userId,'Invoice Reminder','🔔','Sends polite payment reminders when invoices are overdue by 7 days','active','trigger','{"event":"invoice-overdue","days":7}','[]','[{"type":"send-email","to":"client"}]','invoice-reminder',12,d(18),d(72*7),d(18)],
  })
  const a3 = await client.execute({
    sql: agentSql,
    args: [userId,'Weekly Revenue Report','📊','Sends a weekly revenue summary every Monday at 8am','paused','schedule','{"frequency":"weekly","day":"Monday","time":"08:00"}','[]','[{"type":"send-email","to":"me"}]','weekly-revenue-report',8,d(72*4),d(72*14),d(72*14)],
  })
  const id1 = Number(a1.lastInsertRowid)
  const id2 = Number(a2.lastInsertRowid)
  const id3 = Number(a3.lastInsertRowid)
  const runSql = `INSERT INTO agent_runs (agent_id,user_id,status,trigger_event,action_taken,ran_at) VALUES (?,?,?,?,?,?)`
  await client.batch([
    { sql: runSql, args: [id1,userId,'success','Daily schedule triggered','Sent follow-up email to Sarah Chen (Acme Corp)',d(2)] },
    { sql: runSql, args: [id1,userId,'success','Daily schedule triggered','Sent follow-up email to Raj Patel (TechFlow)',d(26)] },
    { sql: runSql, args: [id1,userId,'failed','Daily schedule triggered','Email delivery failed — invalid address',d(50)] },
    { sql: runSql, args: [id1,userId,'success','Daily schedule triggered','Sent follow-up email to James Park (Hencewood)',d(74)] },
    { sql: runSql, args: [id1,userId,'success','Daily schedule triggered','Sent follow-up email to Sophie Laurent (NovaBuild)',d(98)] },
    { sql: runSql, args: [id2,userId,'success','Invoice INV-088 overdue by 7 days','Sent payment reminder to DataSync ($9,800)',d(18)] },
    { sql: runSql, args: [id2,userId,'success','Invoice INV-089 overdue by 7 days','Sent payment reminder to NovaBuild ($6,200)',d(42)] },
    { sql: runSql, args: [id2,userId,'success','Invoice INV-087 overdue by 7 days','Sent payment reminder to Acme Corp ($8,400)',d(66)] },
    { sql: runSql, args: [id3,userId,'success','Monday 8:00am schedule','Generated and emailed weekly revenue report',d(72*4)] },
    { sql: runSql, args: [id3,userId,'success','Monday 8:00am schedule','Generated and emailed weekly revenue report',d(72*11)] },
  ], 'write')
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function seedMarketplaceAgents() {
  const now = new Date()
  const d = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
  const cfg = (icon: string, trigger_type: string, conditions: unknown[], actions: unknown[], schedule?: { schedule_type: string; recurring_config: Record<string, unknown> }) =>
    JSON.stringify({ icon, trigger_type, conditions, actions, ...(schedule || {}) })
  const act = (id: string, type: string, config: Record<string, string> = {}) => ({ id, type, config })
  const rule = (conditionType: string, operator: string, value: string, ifActions: unknown[], elseActions: unknown[]) =>
    ({ id: 'rule1', type: 'rule', rule: { conditionType, operator, value, ifActions, elseActions } })

  const sql = `INSERT INTO marketplace_agents
    (name,slug,description,category,configuration,submitted_by_user_id,submitted_by_profession,clone_count,average_rating,rating_count,approved,featured,created_at,approved_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?,?)`

  const agents = [
    {
      name: 'Monday morning briefing',
      description: 'Your Monday morning briefing. Ready before you are — pipeline, outstanding invoices, overdue follow-ups, and upcoming deadlines in one email, every Monday at 8 AM.',
      category: 'Productivity',
      configuration: cfg('BarChart2', '', [], [
        act('a1', 'generate-report', {}),
        act('a2', 'send-email', { tone: 'summary' }),
      ], { schedule_type: 'recurring', recurring_config: { frequency: 'weekly', time: '08:00', days: ['Monday'], timezone: 'America/New_York' } }),
      profession: 'Independent Consultant',
      clones: 428, rating: 4.9, ratings: 137, age: 62, featured: true,
    },
    {
      name: 'Get paid faster',
      description: 'Sends a payment reminder 3 days before invoice due date — formal for large invoices, friendly for the rest.',
      category: 'Invoicing',
      configuration: cfg('Bell', 'schedule', [], [
        rule('invoice-amount', 'gt', '5000',
          [act('if1', 'send-email', { tone: 'formal', note: 'Includes payment plan option' })],
          [act('else1', 'send-email', { tone: 'friendly' })]),
      ]),
      profession: 'Independent Consultant',
      clones: 312, rating: 4.8, ratings: 94, age: 118,
    },
    {
      name: 'Never lose a client to silence',
      description: 'Flags clients quiet for 30 days and creates a follow-up task — escalates if it drags past 60.',
      category: 'Client Relations',
      configuration: cfg('UserPlus', 'schedule', [{ id: 'c1', type: 'inactive-days', value: '30' }], [
        rule('days-since-contact', 'gt', '60',
          [act('if1', 'notify-me', { urgency: 'high' })],
          [act('else1', 'create-task', {})]),
      ]),
      profession: 'Freelance Designer',
      clones: 189, rating: 4.6, ratings: 61, age: 95,
    },
    {
      name: 'Tax-ready every month',
      description: 'Logs paid invoices to Tax Center on the 1st monthly — flags you if anything is overdue first.',
      category: 'Tax',
      configuration: cfg('FileText', 'schedule', [], [
        rule('invoice-status', 'eq', 'Overdue',
          [act('if1', 'generate-report', {}), act('if2', 'notify-me', {})],
          [act('else1', 'generate-report', {})]),
      ]),
      profession: 'Solo Bookkeeper',
      clones: 247, rating: 4.9, ratings: 88, age: 140,
    },
    {
      name: 'Proposal momentum',
      description: 'Follows up on viewed-but-unanswered proposals after 5 days, nudges you to check in on the rest.',
      category: 'Proposals',
      configuration: cfg('Send', 'proposal-sent', [], [
        rule('proposal-status', 'eq', 'Viewed',
          [act('if1', 'send-email', {})],
          [act('else1', 'notify-me', {})]),
      ]),
      profession: 'Freelance Copywriter',
      clones: 156, rating: 4.5, ratings: 47, age: 72,
    },
    {
      name: 'Weekly business pulse',
      description: "Creates a Monday review task and emails last week's activity summary — flags VIP clients for extra attention.",
      category: 'Productivity',
      configuration: cfg('BarChart2', 'schedule', [], [
        rule('client-tag', 'eq', 'VIP',
          [act('if1', 'notify-me', {}), act('if2', 'create-task', {})],
          [act('else1', 'create-task', {})]),
        act('a2', 'send-email', {}),
      ]),
      profession: 'Independent Developer',
      clones: 203, rating: 4.7, ratings: 69, age: 103,
    },
  ]

  await client.batch(
    agents.map(a => ({
      sql,
      args: [
        a.name, slugify(a.name), a.description, a.category, a.configuration,
        null, a.profession, a.clones, a.rating, a.ratings, ('featured' in a && a.featured) ? 1 : 0, d(a.age), d(a.age - 1),
      ],
    })),
    'write'
  )
}

async function seedActivityLog(userId: number) {
  await client.execute({
    sql: `INSERT INTO activity_log (user_id,message,createdAt) VALUES (?,?,?)`,
    args: [userId, 'Welcome to GuildWire — your workspace is ready', new Date().toISOString()],
  })
}

async function seedNotes(userId: number) {
  const sql = `INSERT INTO notes (user_id,title,content,pinned,linked_client,tags,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`
  const now = new Date()
  const d = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()
  await client.batch([
    { sql, args: [userId, 'Project Kickoff — Acme Corp', '## Meeting Notes — Jul 9\n\nAttendees: Emma Thompson, Alex Rivera\n\n### Goals\n- Redesign the core dashboard for Q3 launch\n- Establish a new design system with component library\n- Align on mobile-first approach\n\n### Key decisions\n- Kick off with a 2-week discovery sprint\n- Weekly syncs every Tuesday at 10am\n- Emma is primary stakeholder, final approval sign-off\n\n### Action items\n- [ ] Share brand guidelines by Friday\n- [ ] Set up shared Figma workspace\n- [ ] Draft SOW v2 by next Monday\n\n> "We want something that feels premium but approachable — think Linear meets Stripe." — Emma', 1, 'Acme Corp', JSON.stringify(['Meeting', 'Design', 'Priority']), d(2), d(2)] },
    { sql, args: [userId, 'TechFlow Discovery Questions', '## Discovery Call Prep — Jul 14\n\nClient: TechFlow Inc (Raj Patel)\nBudget: ~$58k | Timeline: 4 months\n\n### Questions to ask\n1. What does your current analytics stack look like?\n2. Who are the primary users — data analysts or executives?\n3. What are the biggest pain points with your current dashboard?\n4. What integrations are must-haves (Snowflake, BigQuery, dbt)?\n5. Do you have an existing design system or starting from scratch?\n6. What does success look like at the 90-day mark?\n\n### Research notes\n- TechFlow is a Series B SaaS (~200 employees)\n- Their current analytics tool is a legacy Tableau setup\n- Referral from Carlos Mendez — warm intro\n- Recent LinkedIn post about "data democratization" — good angle\n\n### Rate & scope estimate\n- $14,500/month × 4 months = $58,000\n- Includes: discovery, design system, 3 dashboard views, handoff docs', 0, 'TechFlow Inc', JSON.stringify(['Discovery', 'SaaS', 'Prep']), d(18), d(5)] },
    { sql, args: [userId, 'Q3 Goals & Focus Areas', '# Q3 2026 — Personal Goals\n\n## Revenue target: $48,000\n\nCurrent pipeline:\n- Acme Corp retainer: $8,400/mo ✓\n- DataSync v2: $9,800 (due Aug)\n- TechFlow (if closes): $14,500/mo\n- NovaBuild Phase 2: $6,200\n\n## Focus areas\n\n### 1. Niche deeper into SaaS dashboards\nStop taking brand identity work. Every hour on brand is an hour not on the $150/hr dashboard work.\n\n### 2. Productize the discovery process\nCreate a repeatable 2-week discovery sprint I can sell for $4,500. Reduces scope creep massively.\n\n### 3. Raise retainer rate to $9,500/mo\nCurrent: $8,400 with Acme. Renewal is in September — perfect time.\n\n## Non-negotiables\n- No calls before 10am\n- Friday afternoons are protected (portfolio + learning)\n- 3 weeks vacation in Q4', 1, '', JSON.stringify(['Goals', 'Personal', 'Q3']), d(72), d(24)] },
    { sql, args: [userId, 'Invoice Follow-up Scripts', '## Client Communication Templates\n\nUse these when invoices go past due.\n\n---\n\n### 3 days overdue — friendly\n\nSubject: Quick check-in on INV-XXX\n\nHi [Name], just wanted to make sure INV-XXX ($X,XXX) landed in the right place — payment was due [date]. Let me know if you need anything from my end. Happy to resend if needed!\n\n---\n\n### 10 days overdue — firm\n\nSubject: Following up on overdue invoice\n\nHi [Name], I wanted to follow up on INV-XXX ($X,XXX) which is now 10 days past due. Could you let me know the expected payment date? I\'d appreciate getting this sorted.\n\n---\n\n### Notes\n- Always CC yourself\n- Never apologize for following up — it\'s a business transaction\n- If no response after 2 follow-ups, call them directly', 0, '', JSON.stringify(['Templates', 'Finance']), d(96), d(96)] },
  ], 'write')
}

async function seedProposals(userId: number) {
  const now = new Date()
  const d = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()
  const dateStr = (h: number) => new Date(now.getTime() - h * 3600000).toISOString().split('T')[0]
  const sql = `INSERT INTO proposals (user_id,title,client_name,client_email,project_type,status,valid_until,share_token,view_count,last_viewed_at,introduction,problem,solution,deliverables,milestones,line_items,payment_terms,subtotal,total,sent_at,accepted_at,about_me,terms,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  const defaultTerms = `1. All work product created under this proposal becomes the property of the client upon receipt of final payment.\n2. The client may request up to 2 rounds of revisions. Additional revisions are billed at the hourly rate.\n3. Either party may cancel this agreement with 14 days written notice. Work completed to date will be invoiced.\n4. Late payments incur a 1.5% monthly service fee after 30 days.\n5. This proposal is valid for 30 days from the date sent.`
  const about = `I'm a freelance product designer and developer specializing in B2B SaaS dashboards and data-heavy interfaces. I've helped 30+ startups and scale-ups transform complex data into clean, actionable UX.\n\nRecent work includes analytics platforms at Series B companies, enterprise design systems, and mobile-first web applications. I bring both the design sensibility and technical depth to deliver work that ships — not just looks good in Figma.`
  await client.batch([
    { sql, args: [userId,
      'Analytics Dashboard Redesign', 'TechFlow Inc', 'raj@techflow.io', 'Design', 'accepted',
      dateStr(24*30), 'prop_techflow_001', 3, d(24*4),
      "Dear Raj,\n\nThank you for the opportunity to redesign TechFlow's analytics dashboard. After our discovery calls, I'm confident we can create something that not only looks exceptional but meaningfully improves how your team understands and acts on data.\n\nThis proposal outlines my approach, deliverables, timeline, and investment. I'm excited to bring TechFlow's data to life.",
      "TechFlow's current Tableau-based dashboard was built for a team of 5 data analysts. With 200+ employees now needing daily data access — including executives and non-technical stakeholders — the tool creates friction rather than clarity. Key issues: slow load times, no mobile experience, complex filters that confuse non-technical users, and no way to highlight the metrics that actually matter.",
      "I'll redesign TechFlow's core analytics experience from the ground up using a modern component-based approach. The new dashboard will load instantly, work beautifully on mobile, and surface the right metric to the right person automatically. I'll establish a scalable design system so your internal team can maintain and extend it independently.",
      JSON.stringify([
        { id:'d1', name:'UX Audit & Research', description:'Heuristic audit of current tool, 5 user interviews, affinity mapping', included:true },
        { id:'d2', name:'Design System', description:'Color, typography, spacing tokens + 40+ reusable components in Figma', included:true },
        { id:'d3', name:'3 Dashboard Views', description:'Executive summary, analyst deep-dive, and team performance views', included:true },
        { id:'d4', name:'Mobile Responsive', description:'Full mobile layout for all three views', included:true },
        { id:'d5', name:'Handoff Documentation', description:'Component specs, interaction notes, and dev handoff in Figma', included:true },
        { id:'d6', name:'1 Month Support', description:'Bug fixes and minor tweaks after development begins', included:true },
      ]),
      JSON.stringify([
        { id:'m1', name:'Kickoff & Discovery', date: dateStr(24*20), description:'Project kickoff call, stakeholder interviews, current-state audit' },
        { id:'m2', name:'Design System', date: dateStr(24*14), description:'Component library complete, reviewed and approved' },
        { id:'m3', name:'Dashboard Designs', date: dateStr(24*7), description:'All three dashboard views designed and prototyped' },
        { id:'m4', name:'Final Handoff', date: dateStr(24*2), description:'Dev handoff complete, documentation delivered' },
      ]),
      JSON.stringify([
        { id:'li1', name:'UX Research & Audit', qty:1, rate:2500, total:2500 },
        { id:'li2', name:'Design System (Figma)', qty:1, rate:4500, total:4500 },
        { id:'li3', name:'Dashboard Design (3 views)', qty:3, rate:2000, total:6000 },
        { id:'li4', name:'Mobile Responsive Design', qty:1, rate:1500, total:1500 },
      ]),
      '50_upfront', 14500, 14500,
      d(24*6), d(24*4), about, defaultTerms, d(24*8), d(24*4),
    ]},
    { sql, args: [userId,
      'Brand Identity Package', 'Luminary Coffee', 'hello@luminarycoffee.com', 'Design', 'sent',
      dateStr(24*14), 'prop_luminary_001', 1, d(24*1),
      "Hi Maya,\n\nIt was great connecting at the Portland makers market last week. Luminary Coffee has a story worth telling visually — the single-origin sourcing, the roasting process, the community-first ethos. This proposal is my vision for translating all of that into a brand identity that makes people feel something before they've taken a sip.",
      "Luminary Coffee has exceptional product quality and a genuine story, but the current visual identity doesn't do it justice. Generic packaging, an inconsistent color palette, and a logo that could belong to any coffee company mean you're competing on price rather than brand. Independent coffee is having a moment — now is the time to own your identity.",
      "I'll create a full brand identity system that captures the craft, warmth, and intentionality behind Luminary Coffee. Every element — from the primary logo to the packaging patterns to the typography — will feel cohesive, distinctive, and ownable. The deliverable will be a brand book your team can use to stay consistent across every touchpoint.",
      JSON.stringify([
        { id:'d1', name:'Logo Suite', description:'Primary, secondary, and icon marks in all formats (SVG, PNG, PDF)', included:true },
        { id:'d2', name:'Color Palette', description:'Primary, secondary, and neutral palettes with CMYK/RGB/HEX values', included:true },
        { id:'d3', name:'Typography System', description:'Primary and secondary typefaces with usage guidelines', included:true },
        { id:'d4', name:'Brand Patterns', description:'2 custom patterns for packaging and collateral use', included:true },
        { id:'d5', name:'Brand Book (PDF)', description:'Complete brand guidelines document', included:true },
        { id:'d6', name:'Social Media Templates', description:'Canva templates for 4 post formats', included:false },
      ]),
      JSON.stringify([
        { id:'m1', name:'Brand Discovery', date: dateStr(24*10), description:'Brand questionnaire, mood board session, competitive audit' },
        { id:'m2', name:'Concept Presentation', date: dateStr(24*3), description:'3 initial logo directions presented for feedback' },
        { id:'m3', name:'Refinement', date: dateStr(-24*4), description:'Selected direction refined, full system developed' },
        { id:'m4', name:'Final Delivery', date: dateStr(-24*10), description:'All files delivered, brand book complete' },
      ]),
      JSON.stringify([
        { id:'li1', name:'Brand Strategy & Discovery', qty:1, rate:800, total:800 },
        { id:'li2', name:'Logo Design (3 concepts → 1 refined)', qty:1, rate:1800, total:1800 },
        { id:'li3', name:'Full Brand System', qty:1, rate:1200, total:1200 },
        { id:'li4', name:'Brand Guidelines PDF', qty:1, rate:400, total:400 },
      ]),
      'upon_completion', 4200, 4200,
      d(24*3), null, about, defaultTerms, d(24*5), d(24*3),
    ]},
    { sql, args: [userId,
      'E-commerce Platform Build', 'Hencewood Digital', 'james@hencewood.com', 'Development', 'viewed',
      dateStr(24*7), 'prop_hencewood_001', 4, d(36),
      "Hi James,\n\nThank you for the detailed brief on the Hencewood e-commerce expansion. After reviewing your current Shopify setup and the requirements for the custom B2B portal, I can see a clear path to a solution that will serve your wholesale clients significantly better than the current workarounds.",
      "Hencewood's wholesale clients are currently navigating a consumer-facing Shopify store that wasn't designed for B2B purchasing. Custom pricing, volume discounts, NET-30 invoicing, and multi-location ordering aren't supported — leading to manual work for your team and frustration for buyers. You're leaving revenue on the table and burning team time on order management.",
      "I'll build a custom B2B portal integrated with your existing Shopify store. Wholesale clients will have their own login, see their custom pricing, place orders with volume discounts applied automatically, and receive NET-30 invoices via email. Your team will have an admin dashboard to manage accounts, approve credit terms, and view order analytics.",
      JSON.stringify([
        { id:'d1', name:'B2B Customer Portal', description:'Login, custom pricing display, order history, account management', included:true },
        { id:'d2', name:'Shopify Integration', description:'Real-time sync with existing product catalog and inventory', included:true },
        { id:'d3', name:'Custom Pricing Engine', description:'Per-account pricing rules, volume discounts, tiered rates', included:true },
        { id:'d4', name:'Automated Invoicing', description:'NET-30 invoices generated automatically and emailed to buyers', included:true },
        { id:'d5', name:'Admin Dashboard', description:'Account management, order analytics, credit approval workflow', included:true },
        { id:'d6', name:'Mobile Responsive', description:'Full mobile support for buyers ordering from the floor', included:true },
      ]),
      JSON.stringify([
        { id:'m1', name:'Technical Discovery', date: dateStr(24*14), description:'Architecture review, API mapping, environment setup' },
        { id:'m2', name:'Core Portal MVP', date: dateStr(-24*14), description:'Login, catalog, cart, and checkout complete' },
        { id:'m3', name:'Pricing & Invoicing', date: dateStr(-24*28), description:'Custom pricing engine and automated invoicing live' },
        { id:'m4', name:'Admin Dashboard', date: dateStr(-24*42), description:'Full admin tools and analytics delivered' },
        { id:'m5', name:'QA & Launch', date: dateStr(-24*49), description:'Testing, bug fixes, and production deployment' },
      ]),
      JSON.stringify([
        { id:'li1', name:'Technical Discovery & Architecture', qty:1, rate:1500, total:1500 },
        { id:'li2', name:'B2B Portal Development', qty:1, rate:5500, total:5500 },
        { id:'li3', name:'Shopify Integration & Pricing Engine', qty:1, rate:1800, total:1800 },
        { id:'li4', name:'Admin Dashboard', qty:1, rate:800, total:800 },
        { id:'li5', name:'QA, Deployment & Documentation', qty:1, rate:200, total:200 },
      ]),
      'milestone', 9800, 9800,
      d(24*8), null, about, defaultTerms, d(24*10), d(24*8),
    ]},
    { sql, args: [userId,
      'Content Strategy & Copywriting Q4', 'NovaBuild', 'sophie@novabuild.io', 'Writing', 'draft',
      dateStr(-24*14), 'prop_novabuild_001', 0, null,
      '', '', '',
      JSON.stringify([
        { id:'d1', name:'Content Audit', description:'Review all existing web copy and blog content', included:true },
        { id:'d2', name:'Content Strategy', description:'Topics, cadence, SEO keywords, and editorial calendar', included:true },
        { id:'d3', name:'Website Copywriting', description:'Homepage, About, Services, and 3 case studies', included:true },
        { id:'d4', name:'Blog Articles', description:'4 long-form articles (1,500–2,000 words each)', included:true },
      ]),
      JSON.stringify([
        { id:'m1', name:'Audit & Strategy', date: dateStr(-24*28), description:'Content audit complete, strategy presented' },
        { id:'m2', name:'Web Copy', date: dateStr(-24*35), description:'All website pages delivered for review' },
        { id:'m3', name:'Blog Articles', date: dateStr(-24*49), description:'4 articles delivered' },
      ]),
      JSON.stringify([
        { id:'li1', name:'Content Audit & Strategy', qty:1, rate:1200, total:1200 },
        { id:'li2', name:'Website Copywriting (5 pages)', qty:5, rate:350, total:1750 },
        { id:'li3', name:'Blog Articles', qty:4, rate:450, total:1800 },
      ]),
      'upon_completion', 4750, 4750,
      null, null, about, defaultTerms, d(24*2), d(24*2),
    ]},
  ], 'write')
}

async function seedCalendarEvents(userId: number) {
  const sql = `INSERT INTO calendar_events (user_id,title,date,startTime,endTime,type,client,description,color) VALUES (?,?,?,?,?,?,?,?,?)`
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = (n: number) => `${y}-${m}-${String(n).padStart(2, '0')}`
  await client.batch([
    { sql, args: [userId,'Kick-off Call — Tech Trophey', d(3),'10:00','11:00','meeting','Tech Trophey','Discuss brand redesign scope and timeline','#16a34a'] },
    { sql, args: [userId,'Invoice Due', d(5),null,null,'deadline','Hencewood Digital','Payment deadline for API integration project','#d97706'] },
    { sql, args: [userId,'Design Review — Margono', d(7),'14:00','15:30','meeting','Margono Studio','Present dashboard UI mockups for feedback','#16a34a'] },
    { sql, args: [userId,'Submit final deliverables', d(10),null,null,'deadline','Tech Trophey','Final brand assets and style guide','#d97706'] },
    { sql, args: [userId,'Weekly sync', d(12),'09:00','09:30','meeting','Hencewood Digital','Regular check-in on project progress','#16a34a'] },
    { sql, args: [userId,'Quarterly tax estimate', d(15),null,null,'deadline',null,'Q4 estimated tax payment due','#dc2626'] },
    { sql, args: [userId,'Discovery call — NovaBuild', d(17),'11:00','12:00','meeting','NovaBuild','First call with Sophie Laurent re: enterprise project','#16a34a'] },
    { sql, args: [userId,'Finish mobile app screens', d(18),null,null,'task','NovaBuild','Complete all 12 remaining mobile UI screens','#00b857'] },
    { sql, args: [userId,'Portfolio update', d(20),null,null,'task',null,'Add 3 new case studies to personal site','#00b857'] },
    { sql, args: [userId,'Year-end review call', d(28),'15:00','16:00','meeting',null,'Internal review of year performance and goals','#16a34a'] },
  ], 'write')
}

async function seedNewsArticles() {
  const today = new Date()
  const d = (offset: number) => {
    const dt = new Date(today)
    dt.setDate(dt.getDate() - offset)
    return dt.toISOString()
  }

  const articles = [
    // Freelancing
    ['The Rise of AI-Augmented Freelancers: How Independents Are Staying Ahead', 'A new wave of independent professionals is using AI tools not to replace their work but to dramatically expand their capacity. Freelancers who integrate AI into their workflows are taking on 40% more projects while maintaining the same quality, according to a survey of 2,400 independent workers. The key is using AI for the scaffolding — research, first drafts, data analysis — while reserving deep expertise for client-facing work.', 'Fast Company', 'https://fastcompany.com', 'Freelancing', d(0), 4],
    ['Upwork\'s 2026 Freelance Index Shows 18% YoY Growth in Six-Figure Earners', 'The number of freelancers earning over $100,000 annually grew 18% year-over-year, with the largest gains in software development, strategic consulting, and AI integration roles. The platform\'s annual index highlights that experienced independents who specialize in high-value niches are consistently outpacing their salaried counterparts in total compensation.', 'Upwork Research', 'https://upwork.com', 'Freelancing', d(1), 3],
    ['Client Survey: 67% Prefer Freelancers Who Use Professional Proposal Tools', 'A survey of 1,800 business buyers reveals that nearly two-thirds prefer working with independents who send professional digital proposals over those who email PDFs or Google Docs. Buyers cited faster decision-making, clearer scope documentation, and built-in e-signature as the top reasons. Freelancers using proposal software reported a 31% higher acceptance rate.', 'Fiverr Business', 'https://business.fiverr.com', 'Freelancing', d(2), 3],
    // AI & Tools
    ['Anthropic Releases Tool Runner Beta — Freelance Devs Can Now Build Personal Agents', 'Anthropic\'s new Tool Runner beta allows developers to define custom tools using Python decorators or TypeScript Zod schemas, with the SDK handling the entire agentic loop automatically. For freelancers, this opens up powerful possibilities: automated client communication workflows, invoice processing agents, and code review pipelines that run without supervision.', 'Anthropic Blog', 'https://anthropic.com', 'AI & Tools', d(0), 5],
    ['Claude 4.8 Brings Adaptive Thinking to Complex Reasoning Tasks', 'Anthropic\'s Claude Opus 4.8 introduces adaptive thinking — a capability that automatically decides when extended reasoning is needed and adjusts compute accordingly. Early benchmarks show significant improvements on multi-step planning tasks, which has direct implications for freelancers using AI to scope projects, generate proposals, and analyze client requirements.', 'TechCrunch', 'https://techcrunch.com', 'AI & Tools', d(1), 4],
    ['Figma\'s New AI Features Are Reshaping How Designers Scope Projects', 'Figma\'s latest AI release includes intelligent component generation, auto-layout suggestions, and a natural language design search that speeds up the handoff process dramatically. Independent designers are reporting that AI-assisted workflows cut their scoping and estimation time by half — though clients need to be educated on what this means for project timelines and pricing.', 'The Verge', 'https://theverge.com', 'AI & Tools', d(3), 4],
    // Business
    ['Harvard Study: Freelancers Who Set Boundaries Earn 40% More', 'A longitudinal study from Harvard Business School tracked 600 independent professionals over three years and found a consistent pattern: those who established clear working hours, scope boundaries, and revision limits earned 40% more per hour than those who remained perpetually available. The research suggests that scarcity signals expertise, and expertise commands premium rates.', 'Harvard Business Review', 'https://hbr.org', 'Business', d(1), 5],
    ['The Referral Playbook: How Top Freelancers Win 80% of Work Through Introductions', 'The most successful independent professionals don\'t chase leads — they engineer referral systems. A detailed analysis of 300 six-figure freelancers found that 80% of their work came through introductions. The common thread: they made it easy to refer them by having a clear niche, a memorable positioning statement, and a habit of asking for introductions at project completion rather than waiting.', 'Morning Brew', 'https://morningbrew.com', 'Business', d(2), 6],
    // Finance
    ['IRS Issues New Guidance on Freelancer Home Office Deductions for 2026', 'The IRS released updated guidance clarifying the home office deduction rules for independent contractors, including new safe harbor calculations for shared-use spaces and remote-first hybrid setups. The guidance also addresses deductions for AI software subscriptions, cloud services, and professional development tools — all increasingly common expenses for modern freelancers.', 'Forbes', 'https://forbes.com', 'Finance', d(0), 5],
    ['Stripe Express Adds Automatic Tax Withholding for US Freelancers', 'Stripe\'s Express platform now offers optional automatic tax withholding for US-based independent contractors, calculating estimated quarterly tax obligations in real time and setting funds aside automatically. Early users report dramatically less anxiety around tax season and fewer underpayment penalties. The feature supports both federal and state obligations.', 'Stripe Blog', 'https://stripe.com', 'Finance', d(2), 3],
    // Remote Work
    ['Async-First Companies See 23% Higher Freelancer Retention, Report Shows', 'Organizations that adopt async-first communication practices retain their freelance talent 23% longer than those relying on synchronous meetings, according to a new workplace research report. Freelancers cite reduced context-switching, clearer written briefs, and respect for deep work blocks as the primary reasons they prefer async-first clients. The finding has significant implications for how independents should qualify prospects.', 'Fast Company', 'https://fastcompany.com', 'Remote Work', d(1), 4],
    // Tech
    ['Next.js 17 Ships with Built-in Edge AI Runtime for Serverless Functions', 'Next.js 17 introduces a native Edge AI runtime that allows serverless functions to run lightweight AI models — including embeddings and classification — directly at the edge with zero cold starts. For freelance developers, this eliminates a common architectural headache: deploying separate AI inference infrastructure for client projects that use AI features.', 'Hacker News', 'https://news.ycombinator.com', 'Tech', d(0), 4],
    ['Vercel Announces Free Tier Expansion for Independent Developers', 'Vercel has significantly expanded its free tier, doubling bandwidth allowances and removing the previous 100GB limit on Edge Network caching. The platform also added free team collaboration seats for solo developers who bring in external stakeholders. For freelancers, this means more client projects can run on Vercel without hitting billing thresholds during development.', 'Vercel Blog', 'https://vercel.com', 'Tech', d(3), 3],
    // Consulting
    ['McKinsey Report: 38% of Enterprise Projects Now Use Independent Consultants', 'McKinsey\'s annual workforce study finds that 38% of enterprise transformation projects now include at least one independent consultant in a key role — up from 24% three years ago. The trend is driven by the speed advantage of engaging specialists over hiring permanent staff. The report notes that independents who can show ROI on previous engagements command significantly higher rates.', 'Wall Street Journal', 'https://wsj.com', 'Consulting', d(1), 6],
    ['The $200/Hour Threshold: Positioning Yourself as a Senior Independent Expert', 'Breaking through the $200/hour ceiling requires a fundamental shift in how you position your services — moving from deliverable-based to outcomes-based pricing. Consultants who charge premium rates share three traits: a narrow, specific niche; documented results from previous engagements; and a willingness to walk away from clients who don\'t value expertise. The article breaks down the exact language shifts that justify premium positioning.', 'LinkedIn', 'https://linkedin.com', 'Consulting', d(4), 7],
  ]

  for (const [title, summary, source, source_url, category, published_at, read_time] of articles) {
    await client.execute({
      sql: `INSERT INTO news_articles (title, summary, source, source_url, category, published_at, read_time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [title, summary, source, source_url, category, published_at, read_time],
    })
  }

  // Seed today's briefing
  const todayStr = new Date().toISOString().split('T')[0]
  const briefing = `Today's big story: Anthropic released the Tool Runner beta, making it dramatically easier for developers to build personal automation agents — a major win for freelancers who want to automate follow-up emails, invoice reminders, and client onboarding without writing complex orchestration code.

On the business side, a Harvard study confirms what top earners already know: setting firm boundaries on availability and scope isn't just professional — it's the single biggest lever for increasing hourly rates, with adherents earning 40% more than always-available peers.

For finance: the IRS dropped new guidance on home office deductions and software subscriptions that will affect most independents' 2026 returns. Read this one before you file. Quick hit: Vercel expanded its free tier, cutting infrastructure costs for freelance developers shipping client projects.`

  await client.execute({
    sql: `INSERT OR IGNORE INTO news_briefings (date, content) VALUES (?, ?)`,
    args: [todayStr, briefing],
  })
}

async function seedBlogPosts() {
  const posts = [
    {
      title: `You're Not a Freelancer. You're a Micro-Business Owner.`,
      slug: 'youre-not-a-freelancer-youre-a-micro-business-owner',
      category: 'Opinion',
      excerpt: `The label you use for yourself changes everything — how you price, how you present yourself, and how clients treat you. It's time to upgrade the vocabulary.`,
      featured: 1,
      status: 'published',
      publish_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      read_time: 4,
      meta_title: `You're Not a Freelancer. You're a Micro-Business Owner. | GuildWire Blog`,
      meta_description: `The label you use changes how clients treat you and how you treat yourself. Here's why the mindset shift from freelancer to business owner is the most important upgrade you'll make.`,
      content: `<p>The word "freelancer" has baggage. It implies someone who picks up gigs between real jobs, someone whose work is fundamentally disposable. And the way most independents carry themselves — apologetically, always available, discounting to close — suggests they've internalized that label too deeply.</p>

<p>You are not a freelancer. You are the founder, CEO, head of sales, lead delivery person, and CFO of a micro-business. Upgrading that vocabulary is the first step to upgrading everything else.</p>

<h2>The Language We Use Shapes How We Think</h2>

<p>When you call yourself a freelancer, you invite certain expectations. Clients expect you to be infinitely flexible, to fit into their processes, and to price by the hour like a commodity. When you describe yourself as a consultant, an independent studio, or a specialist firm — the same person doing the same work — the conversation shifts entirely.</p>

<blockquote>The most successful independents I know don't use the word "freelancer" when describing what they do. It's a category that implies a ceiling.</blockquote>

<p>This isn't about pretense. It's about framing. A business owner doesn't apologize for their rates. A business owner doesn't respond to every email the same day out of fear they'll lose the client. A business owner fires clients who don't fit.</p>

<h2>What Changes When You Make the Shift</h2>

<h3>1. How you price</h3>
<p>Freelancers bill time. Business owners price for outcomes. When you start thinking of yourself as a business, you stop asking "how many hours will this take?" and start asking "what is the outcome worth to this client?" That shift alone can double your effective hourly rate without a single conversation about rates.</p>

<h3>2. How you structure your day</h3>
<p>Freelancers are reactive. They respond to whatever comes in. Business owners schedule deep work, protect mornings for high-leverage activities, and build systems so that not every client question requires their direct attention. The systems are what give you leverage.</p>

<h3>3. How you handle difficult conversations</h3>
<p>When a client asks for scope outside the agreement, a freelancer often says yes to avoid conflict. A business owner refers to the contract, explains the impact, and asks for approval on additional budget. Not adversarially — professionally. Because that's how businesses operate.</p>

<h2>The Practical Starting Point</h2>

<p>Start with how you introduce yourself. Instead of "I'm a freelance designer," try "I run an independent design studio focused on SaaS product interfaces." Same work. Completely different positioning.</p>

<p>Then look at your systems: Do you have a clear onboarding process? A contract that actually protects you? A way of scoping work that prevents budget overruns? These aren't nice-to-haves for a business — they're the baseline.</p>

<p>GuildWire exists because I wanted a platform that treated independent professionals like the business owners they are. Not a gig marketplace. Not a freelancer directory. A proper operating system for serious independents.</p>

<p>The label is just the beginning. The mindset is the whole game.</p>`,
    },
    {
      title: `The 5-Step Scoping System That Eliminated Scope Creep in My Business`,
      slug: '5-step-scoping-system-eliminate-scope-creep',
      category: 'Practical',
      excerpt: `After getting burned on three projects in six months, I built a scoping process that hasn't failed me since. Here's the exact system.`,
      featured: 0,
      status: 'published',
      publish_date: new Date(Date.now() - 7 * 86400000).toISOString(),
      read_time: 5,
      meta_title: `The 5-Step Project Scoping System That Eliminates Scope Creep | GuildWire Blog`,
      meta_description: `Scope creep is a systems problem, not a client problem. Here's the exact 5-step scoping process I use to protect every project from budget overruns.`,
      content: `<p>Scope creep cost me three projects in six months. Not in a dramatic blow-up-and-lose-the-client way — worse. It cost me quietly, in unpaid hours, in eroded margins, in the specific exhaustion of knowing you're underpaid and not knowing how to fix it mid-engagement.</p>

<p>The system I built after that hasn't failed once. Here it is.</p>

<h2>Step 1: The Outcome Frame</h2>

<p>Before you scope any work, get crystal clear on the single measurable outcome the client actually cares about. Not what they've asked for — what they're trying to achieve. This is a conversation, not a form. Ask: "If this project succeeds completely, what does success look like in a year?"</p>

<p>This frame does two things: it grounds every decision that follows in business value, and it surfaces the real project — which is often different from the stated project.</p>

<h2>Step 2: The Scope Document</h2>

<p>Write a scope document before any contract. One page, maximum. It includes: what's in scope, what's explicitly out of scope, and the number of revision rounds included. The out-of-scope list is the most important part. You cannot close a scope that isn't bounded.</p>

<blockquote>The best scope documents I've written have longer "out of scope" sections than "in scope" sections. The client doesn't care what you're not doing — but you do.</blockquote>

<h2>Step 3: Price to the Scope, Not the Time</h2>

<p>Once you have the scope document, price it as a fixed deliverable. Don't say "this will take 40 hours at $150." Say "this engagement is $8,000, delivered by [date], with two rounds of revisions." You're removing your time from the equation and anchoring to output.</p>

<p>If you genuinely can't estimate, use a paid discovery phase to get to a fixed price. A 5-hour paid discovery at $750 that leads to a $12,000 project is better than guessing and absorbing overruns.</p>

<h2>Step 4: The Change Order Process</h2>

<p>When a client requests something outside scope — and they will — you have a process. Not a confrontation, a process. "That's a great addition. It falls outside our current scope, so I'll put together a change order for your approval before we proceed." A change order is a one-page document: what's being added, what it costs, and a signature field.</p>

<p>Most clients don't push back on change orders when they're professional and clear. The change order is also your protection if they do.</p>

<h2>Step 5: The Retrospective</h2>

<p>After every project, before you close the final invoice, answer three questions: Did the project come in at scope? If not, where did scope expand and why? What would I do differently next time?</p>

<p>Scope creep isn't a client problem. It's a system problem. Build a better system.</p>`,
    },
    {
      title: `Building GuildWire While Running Client Projects: What Actually Happened`,
      slug: 'building-guildwire-while-running-client-projects',
      category: 'Personal',
      excerpt: `Everyone makes it sound clean. Build in public, ship fast, be transparent. Here's the reality of building a product while keeping the lights on through client work.`,
      featured: 0,
      status: 'published',
      publish_date: new Date(Date.now() - 14 * 86400000).toISOString(),
      read_time: 4,
      meta_title: `Building GuildWire While Running Client Projects | GuildWire Blog`,
      meta_description: `The honest story of building a product while still billing clients, including every mistake and the systems that eventually made it work.`,
      content: `<p>The narrative version goes: I had an insight, I built the product, I shipped it, and now here we are. That's not what happened.</p>

<p>What actually happened is that I spent eight months building GuildWire in the margins of a full client schedule, made every mistake possible, nearly quit three times, and learned more about product development and my own limits than I had in the previous five years of consulting combined.</p>

<h2>The First Six Months Were Part-Time</h2>

<p>I was billing around $14,000 a month when I started building GuildWire. Not enough to feel financially safe quitting client work, but enough to feel guilty about splitting my attention. The result was that I gave clients 60% and the product 25%, and the remaining 15% went to anxiety about both.</p>

<p>The turning point wasn't a financial milestone — it was a time architecture decision. I blocked Tuesday and Thursday mornings, 7am to noon, as non-negotiable product time. Client work happened around that block. Within six weeks, my client communications got more efficient because I had less time for them, and my product work got more focused because I had less time for it too.</p>

<blockquote>Constraints aren't the enemy of creative work. They're the structure that makes creative work possible.</blockquote>

<h2>What I Got Wrong</h2>

<p>I tried to build too much before talking to users. The first version of GuildWire had eight features, four of which I've since removed. I built based on my own problems as a consultant, which is a reasonable starting point, but I needed to validate assumptions much earlier than I did.</p>

<p>I also underestimated how long it would take to go from "working" to "good." The gap between something that technically functions and something you'd be proud to show to a serious professional is enormous. I shipped three versions that I now find embarrassing.</p>

<h2>What Kept Me Going</h2>

<p>The users who showed up even when the product was rough. The freelancer who told me they'd sent their first professional proposal and closed a client in the same week. The consultant who started treating their business like a business after reading a post I wrote. Those moments make the rest of it worth it.</p>

<p>Building something people actually use is different from building something people say is interesting. I chased "interesting" for too long. "Useful" is the only metric that matters.</p>

<h2>Where We Are Now</h2>

<p>GuildWire is still early. There are rough edges and features I want to add and things that don't work as well as I'd like. But it's real, it's used, and it makes a genuine difference for the independents who rely on it. That's the only bar that mattered.</p>

<p>If you're building something on the side right now: keep going. The version you ship in month two is better than the idea you protected in month one.</p>`,
    },
    {
      title: `The Referral Playbook: Getting 80% of Work Through Warm Introductions`,
      slug: 'referral-playbook-warm-introductions',
      category: 'Practical',
      excerpt: `Cold outreach is a slot machine. Referrals are a system you can engineer. Here's exactly how I built one that consistently fills my pipeline without a single cold email.`,
      featured: 0,
      status: 'published',
      publish_date: new Date(Date.now() - 21 * 86400000).toISOString(),
      read_time: 5,
      meta_title: `The Referral Playbook: Getting 80% of Work Through Warm Introductions | GuildWire Blog`,
      meta_description: `A step-by-step system for engineering a referral pipeline that keeps filling itself — including the exact words to use when asking for introductions.`,
      content: `<p>Cold outreach has a place. But it's a slot machine — you pull the handle, spend the tokens, and occasionally get lucky. Referrals are a different kind of machine entirely. They're a system you can engineer, repeat, and improve. I get over 80% of my projects through warm introductions, and it's not an accident.</p>

<h2>The Fundamental Misconception</h2>

<p>Most independents treat referrals as something that happens to them. Someone they know happens to recommend them, and they're grateful, and then they wait for it to happen again. This is passive referral dependency. It feels like referrals but it's really just luck with a branding problem.</p>

<p>An intentional referral system is something you build and actively operate. The difference is significant.</p>

<h2>The Three Components</h2>

<h3>1. A referable positioning statement</h3>
<p>You cannot be referred effectively if the person referring you can't explain what you do in a single sentence. "He's really talented" doesn't get meetings. "She's the person who helps B2B SaaS companies rewrite their onboarding and double their 30-day retention" gets meetings.</p>

<p>Your positioning statement needs to be specific enough that when someone in your referrer's network has that exact problem, your name is the only name that comes to mind.</p>

<h3>2. The end-of-project ask</h3>
<p>The best moment to ask for a referral is at the peak of client satisfaction — which is typically right after a major milestone or at project completion, before the invoice is paid and before they've had time to move on to the next thing.</p>

<p>The script is simple: "This has been a great engagement. The kind of client I work best with is [description]. If anyone in your network comes to mind, I'd genuinely appreciate an introduction." That's it. No forms, no referral programs, just a direct ask at the right moment.</p>

<blockquote>The ask has to be specific. "Let me know if you know anyone" gets no introductions. "If you know any early-stage SaaS founders working on growth" gets introductions.</blockquote>

<h3>3. The follow-through system</h3>
<p>When someone says "I'll think about it," put them in a 30-day follow-up. Not automated — a handwritten note or a direct message. "Hey, just following up on our conversation about introductions. No pressure at all — just wanted to make sure I didn't drop the thread." Most referrals happen on the follow-up, not the original ask.</p>

<h2>The Compound Effect</h2>

<p>Referral systems compound in a way cold outreach never does. Every satisfied client is a potential referrer. Every referral that turns into a client is a new potential referrer. Over time, your network becomes self-reinforcing, and the quality of inbound leads continuously improves because people refer people who are similar to themselves.</p>

<p>Build the system. Work the system. Then watch it work for you.</p>`,
    },
  ]

  for (const post of posts) {
    await client.execute({
      sql: `INSERT INTO blog_posts (title, slug, category, excerpt, content, featured, status, publish_date, meta_title, meta_description, read_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [post.title, post.slug, post.category, post.excerpt, post.content, post.featured, post.status, post.publish_date, post.meta_title, post.meta_description, post.read_time],
    })
  }
}
