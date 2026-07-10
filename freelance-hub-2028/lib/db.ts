import { createClient, type InValue, type Row } from '@libsql/client'
import { scryptSync, randomBytes } from 'crypto'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:/tmp/guildwire.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})

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
    sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName) VALUES (?,1,0,0,1,1,?)`,
    args: [userId, 'My Studio'],
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
    sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName) VALUES (?,1,0,0,1,1,?)`,
    args: [userId, 'My Studio'],
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
        amount INTEGER DEFAULT 0, status TEXT, issued TEXT, due TEXT, avatar TEXT, color TEXT
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
        displayName TEXT, email TEXT, headline TEXT, skills TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY,
        notifications INTEGER DEFAULT 1, twoFactor INTEGER DEFAULT 0,
        darkMode INTEGER DEFAULT 0, invoiceAutoSend INTEGER DEFAULT 1,
        weeklyDigest INTEGER DEFAULT 1, workspaceName TEXT DEFAULT 'My Studio'
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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agent_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'success',
        trigger_event TEXT DEFAULT '',
        action_taken TEXT DEFAULT '',
        ran_at TEXT NOT NULL
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
    `ALTER TABLE jobs ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE integrations ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tax_documents ADD COLUMN category TEXT DEFAULT 'Other Tax Documents'`,
  ]
  for (const m of migrations) await client.execute(m).catch(() => {})

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
      sql: `INSERT OR IGNORE INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName) VALUES (?,1,0,0,1,1,?)`,
      args: [demoId, 'My Studio'],
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
