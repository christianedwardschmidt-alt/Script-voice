import { createClient, type Client, type Row } from '@libsql/client'
import { scryptSync, randomBytes } from 'crypto'

declare global {
  // eslint-disable-next-line no-var
  var __turso: Client | undefined
}

function getClient(): Client {
  if (globalThis.__turso) return globalThis.__turso
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error('TURSO_DATABASE_URL is not set')
  const c = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  if (process.env.NODE_ENV !== 'production') globalThis.__turso = c
  return c
}

export const db = getClient()

export function toRow(r: Row): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(r)) {
    obj[k] = typeof v === 'bigint' ? Number(v) : v
  }
  return obj
}

export function toRows(rs: Row[]): Record<string, unknown>[] {
  return rs.map(toRow)
}

export async function logActivity(userId: number, message: string): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)`,
      args: [userId, message, new Date().toISOString()],
    })
  } catch { /* non-critical */ }
}

export async function createUserDefaults(userId: number, name: string, email: string): Promise<void> {
  const now = new Date().toISOString()
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO profile (user_id, displayName, email, headline, skills) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, name, email, 'Freelancer', ''],
    },
    {
      sql: `INSERT OR IGNORE INTO settings (user_id, notifications, twoFactor, darkMode, invoiceAutoSend, weeklyDigest) VALUES (?, 1, 0, 0, 1, 1)`,
      args: [userId],
    },
    {
      sql: `INSERT OR IGNORE INTO contact_info (user_id, fullName, email, phone, website, location, timezone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, name, email, '', '', '', 'UTC', ''],
    },
    {
      sql: `INSERT INTO activity_log (user_id, message, createdAt) VALUES (?, ?, ?)`,
      args: [userId, 'Welcome to GuildWire — your workspace is ready', now],
    },
  ], 'write')

  const integrations = [
    ['ms365', 'Microsoft 365', 'Word, Excel, PowerPoint, Outlook & Teams', '🪟', 'Productivity', '#0078d4'],
    ['notion', 'Notion', 'All-in-one workspace for notes and docs', '◼', 'Productivity', '#1c1917'],
    ['slack', 'Slack', 'Team communication and collaboration', '💬', 'Productivity', '#4a154b'],
    ['figma', 'Figma', 'Collaborative design and prototyping', '🎨', 'Design', '#f24e1e'],
    ['adobe', 'Adobe Creative Cloud', 'Photoshop, Illustrator, XD & more', '🔴', 'Design', '#ff0000'],
    ['github', 'GitHub', 'Version control and code collaboration', '🐙', 'Development', '#1c1917'],
    ['vscode', 'VS Code', 'Code editor with extensions and sync', '💙', 'Development', '#007acc'],
    ['vercel', 'Vercel', 'Frontend deployment and edge network', '▲', 'Development', '#1c1917'],
    ['stripe', 'Stripe', 'Payment processing and subscriptions', '💳', 'Finance', '#6772e5'],
    ['wise', 'Wise', 'International transfers and multi-currency', '🌍', 'Finance', '#9fe870'],
    ['quickbooks', 'QuickBooks', 'Accounting software for freelancers', '📊', 'Finance', '#2ca01c'],
    ['canva', 'Canva', 'Quick design tool for social media', '🖼', 'Design', '#00c4cc'],
  ]
  await db.batch(
    integrations.map(([id, name, desc, icon, category, color]) => ({
      sql: `INSERT OR IGNORE INTO integrations (id, user_id, name, desc, icon, connected, lastSync, category, color) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
      args: [id, userId, name, desc, icon, category, color],
    })),
    'write'
  )
}

async function seedDemoUser(): Promise<void> {
  const res = await db.execute({ sql: `SELECT id FROM users WHERE email = ?`, args: ['demo@guildwire.io'] })
  if (res.rows.length > 0) return

  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync('demo1234', salt, 64).toString('hex')
  const now = new Date().toISOString()

  const userRes = await db.execute({
    sql: `INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)`,
    args: ['demo@guildwire.io', 'Chris Schmidt', `${salt}:${hash}`, now],
  })
  const userId = Number(userRes.lastInsertRowid!)

  await createUserDefaults(userId, 'Chris Schmidt', 'demo@guildwire.io')

  // Connect some integrations for demo
  await db.batch([
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['2 min ago', userId, 'ms365'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['5 min ago', userId, 'notion'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['1 min ago', userId, 'slack'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['10 min ago', userId, 'figma'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['3 min ago', userId, 'github'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['15 min ago', userId, 'vscode'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['1 min ago', userId, 'stripe'] },
    { sql: `UPDATE integrations SET connected=1, lastSync=? WHERE user_id=? AND id=?`, args: ['20 min ago', userId, 'wise'] },
  ], 'write')

  // Update profile for demo
  await db.execute({
    sql: `UPDATE profile SET headline=?, skills=? WHERE user_id=?`,
    args: ['Full Stack Developer & UI Designer', 'React, TypeScript, Figma, Next.js', userId],
  })

  // Update contact_info for demo
  await db.execute({
    sql: `UPDATE contact_info SET phone=?, website=?, location=?, timezone=? WHERE user_id=?`,
    args: ['+1 (555) 000-0000', 'yoursite.com', 'San Francisco, CA', 'PST (UTC-8)', userId],
  })

  // Seed clients
  const clients = [
    ['Emma Thompson', 'Tech Trophey', 'emma@techtrophey.com', '+1 (555) 234-5678', 'techtrophey.com', '👩🏻‍💼', '#15803d', 'active', 24500, 5],
    ['James Park', 'Hencewood Digital', 'james@hencewood.io', '+1 (555) 345-6789', 'hencewood.io', '👨🏻‍💻', '#ec4899', 'active', 18200, 3],
    ['Aisha Williams', 'Margono Studio', 'aisha@margono.co', '+1 (555) 456-7890', 'margono.co', '👩🏿‍💼', '#f59e0b', 'active', 15800, 4],
  ]
  await db.batch(
    clients.map(([name, company, email, phone, website, avatar, color, status, revenue, projects]) => ({
      sql: `INSERT INTO clients (user_id, name, company, email, phone, website, avatar, color, status, revenue, projects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, name, company, email, phone, website, avatar, color, status, revenue, projects],
    })),
    'write'
  )

  // Seed CRM clients
  const crmClients = [
    ['Emma Thompson', 'Acme Corp', 'emma@acmecorp.com', '+1 (555) 234-5678', 'acmecorp.com', 'Active', 18500, '👩🏻‍💼', '#15803d', '["Design","Retainer"]', '1h ago', 1, 5, 'Long-term client. Pays on time. Expanding to mobile app.'],
    ['James Park', 'TechFlow Inc', 'jpark@techflow.io', '+1 (555) 345-6789', 'techflow.io', 'Proposal', 12000, '👨🏻‍💻', '#22c55e', '["Development","API"]', '3h ago', 0, 4, 'Needs detailed scope. Budget is flexible if scope is clear.'],
    ['Aisha Williams', 'Bright Ideas Co', 'aisha@brightideas.co', '+1 (555) 456-7890', 'brightideas.co', 'Negotiation', 9800, '👩🏿‍💼', '#d97706', '["Marketing","Content"]', '1d ago', 1, 4, 'Negotiating on timeline. They want delivery in 3 weeks.'],
    ['Carlos Mendez', 'DataSync', 'carlos@datasync.io', '+1 (555) 567-8901', 'datasync.io', 'Active', 24000, '👨🏽‍💼', '#14b8a6', '["Development","Data","Premium"]', '2d ago', 0, 5, 'High-value client. Careful with deadlines. C-level contacts.'],
    ['Sophie Laurent', 'NovaBuild', 'sophie@novabuild.fr', '+33 1 23 45 67 89', 'novabuild.fr', 'Lead', 35000, '👩🏻‍🎨', '#78716c', '["Design","Enterprise","New"]', '3d ago', 1, 3, 'Warm lead from LinkedIn. Need to schedule discovery call.'],
    ['Raj Patel', 'InnovateTech', 'raj@innovatetech.in', '+91 98765 43210', 'innovatetech.in', 'Completed', 8200, '👨🏽‍💻', '#4ade80', '["Development","Completed"]', '2w ago', 0, 4, 'Project completed successfully. Ask for referral.'],
  ]
  await db.batch(
    crmClients.map(([name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes]) => ({
      sql: `INSERT INTO crm_clients (user_id, name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes],
    })),
    'write'
  )

  // Seed tasks
  const tasks = [
    ['Complete website redesign mockups', 'Create high-fidelity mockups for the client homepage and product pages', 'high', 'in progress', 'Jan 14', 'Tech Trophey Website', '["figma","slack","google"]', 0],
    ['Review frontend code pull request', 'Check the new React components for best practices', 'medium', 'todo', 'Jan 12', 'Hencewood Digital', '["github","slack"]', 0],
    ['Client meeting - Project kickoff', 'Discuss project scope and timeline with new client', 'high', 'todo', 'Jan 11', 'Margono Studio', '["slack"]', 0],
    ['Update portfolio website', 'Add recent case studies and update project showcase', 'low', 'todo', 'Jan 20', 'Personal', '[]', 0],
  ]
  await db.batch(
    tasks.map(([title, description, priority, status, dueDate, project, integrations, checked]) => ({
      sql: `INSERT INTO tasks (user_id, title, description, priority, status, dueDate, project, integrations, checked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, title, description, priority, status, dueDate, project, integrations, checked],
    })),
    'write'
  )

  // Seed invoices
  const invoices = [
    ['INV-089', 'Tech Trophey', 'Brand Redesign Q4', 4800, 'Paid', 'Nov 15', 'Dec 15', '👩🏻‍💼', '#15803d'],
    ['INV-090', 'Hencewood Digital', 'API Integration', 3200, 'Pending', 'Dec 1', 'Jan 1', '👨🏻‍💻', '#ec4899'],
    ['INV-088', 'Margono Studio', 'Dashboard UI', 8400, 'Overdue', 'Oct 20', 'Nov 20', '👩🏿‍💼', '#f59e0b'],
    ['INV-091', 'NovaBuild', 'Mobile App', 2100, 'Draft', 'Dec 20', 'Jan 20', '👨🏽‍💼', '#10b981'],
  ]
  await db.batch(
    invoices.map(([id, client, project, amount, status, issued, due, avatar, color]) => ({
      sql: `INSERT INTO invoices (id, user_id, client, project, amount, status, issued, due, avatar, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, client, project, amount, status, issued, due, avatar, color],
    })),
    'write'
  )

  // Seed jobs
  const jobs = [
    ['Senior UI/UX Designer', 'Stripe', 'Remote', 'Contract', '$120–160/hr', '2h ago', '["Figma","Design Systems","React"]', 'Looking for an experienced designer to lead our dashboard redesign. 3-month engagement.', 4.9, 24, 0],
    ['Full Stack Next.js Developer', 'Vercel', 'Remote', 'Project', '$18,000 fixed', '5h ago', '["Next.js","TypeScript","PostgreSQL"]', 'Build a SaaS analytics platform from scratch. Solo project, 2 months timeline.', 4.7, 18, 1],
    ['Brand Identity Designer', 'Linear', 'Hybrid', 'Contract', '$90–110/hr', '1d ago', '["Branding","Illustration","Motion"]', 'Refreshing our brand identity. Need a creative who understands B2B SaaS.', 4.8, 31, 0],
    ['React Native Developer', 'Notion', 'Remote', 'Retainer', '$8,500/mo', '2d ago', '["React Native","iOS","Android"]', 'Ongoing mobile app development. 20 hrs/week retainer arrangement.', 5.0, 12, 0],
  ]
  await db.batch(
    jobs.map(([title, company, location, type, budget, posted, tags, description, rating, reviews, saved]) => ({
      sql: `INSERT INTO jobs (user_id, title, company, location, type, budget, posted, tags, description, rating, reviews, saved, applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [userId, title, company, location, type, budget, posted, tags, description, rating, reviews, saved],
    })),
    'write'
  )

  // Seed courses
  const courses = [
    ['Advanced Figma for Freelancers', 'Sarah Chen', 'Design', '8h 30m', 42, 4.9, 65, 1, 0, '#15803d', 'Free'],
    ['Full-Stack Next.js', 'Marcus Williams', 'Development', '22h', 95, 4.8, 30, 1, 79, '#10b981', 'Bestseller'],
    ['AI Tools for Freelancers', 'Priya Sharma', 'AI & ML', '6h 45m', 28, 4.9, 0, 0, 49, '#f59e0b', 'New'],
    ['Freelance Business Mastery', 'James Rodriguez', 'Business', '11h', 56, 4.7, 100, 1, 89, '#ec4899', null],
    ['UX Research & Testing', 'Aisha Johnson', 'Design', '9h', 38, 4.8, 0, 0, 59, '#06b6d4', 'Popular'],
    ['Content Marketing', 'Tom Blake', 'Marketing', '7h 50m', 33, 4.6, 0, 0, 39, '#78716c', null],
  ]
  await db.batch(
    courses.map(([title, instructor, category, duration, lessons, rating, progress, enrolled, price, color, badge]) => ({
      sql: `INSERT INTO courses (user_id, title, instructor, category, duration, lessons, rating, progress, enrolled, price, color, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, title, instructor, category, duration, lessons, rating, progress, enrolled, price, color, badge],
    })),
    'write'
  )

  // Seed posts
  const postsData = [
    ['Sarah Johnson', '@sarahj_ux', 'Senior UI/UX Designer', '👩🏻‍🎨', '#15803d', '2h', 1, 'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off.\n\nHere\'s what worked for me:\n→ Niching down to SaaS dashboards only\n→ Cold outreach with a custom Loom video\n→ Packaging services at 3 clear price points\n\nThe journey is everything. Keep going. 💜', '{"type":"design","label":"Dashboard Redesign Preview","emoji":"🖥","grad":"linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)"}', 142, 38, 21, 8400],
    ['Marcus Williams', '@marcusdev', 'Full Stack Developer', '👨🏾‍💻', '#10b981', '5h', 0, 'Hot take: The single best thing I did for my freelance career was raising my rates.\n\nWent from $85/hr → $150/hr and actually got MORE serious clients.\n\nPrice is a signal. Premium pricing filters out problem clients automatically. Don\'t under-price to win — it signals risk.', '{"type":"chart","label":"Revenue Growth 2025→2026","emoji":"📈","grad":"linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)"}', 287, 64, 89, 21300],
    ['Priya Sharma', '@priya_uxr', 'UX Researcher', '👩🏽‍💻', '#f59e0b', '1d', 0, 'Sharing my freelance contract template — took me 2 years and one bad client experience to get right.\n\nIncludes:\n✅ Scope of work clauses\n✅ Revision limits\n✅ Kill fee (25% if client cancels)\n✅ IP ownership on final payment\n\nDM me for the full version. No strings.', null, 512, 97, 203, 34100],
    ['Tom Blake', '@tomblake_brand', 'Brand Strategist', '👨🏼‍💼', '#06b6d4', '2d', 0, 'My home office setup after 3 years of freelancing. The monitor arm was a game changer. 🖥\n\nTools I swear by:\n• Standing desk (health investment)\n• Good mic (clients notice)\n• Notion + GuildWire for project tracking\n\nWhat\'s your must-have setup piece?', '{"type":"photo","label":"Home Office Setup","emoji":"🖥","grad":"linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)"}', 94, 41, 7, 5200],
  ]
  await db.batch(
    postsData.map(([author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views]) => ({
      sql: `INSERT INTO posts (user_id, author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
      args: [userId, author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, new Date(Date.now() - 2 * 3600 * 1000).toISOString()],
    })),
    'write'
  )

  // Seed tax deductions
  const deductions = [
    ['Home Office', 3600, '🏠', 5400, '#15803d'],
    ['Software & Tools', 2840, '💻', 5400, '#ec4899'],
    ['Health Insurance', 5400, '🏥', 5400, '#10b981'],
    ['Equipment', 4100, '🖥', 5400, '#f59e0b'],
    ['Education', 1200, '📚', 5400, '#06b6d4'],
    ['Internet & Phone', 960, '📡', 5400, '#78716c'],
  ]
  await db.batch(
    deductions.map(([category, amount, icon, max, color]) => ({
      sql: `INSERT INTO tax_deductions (user_id, category, amount, icon, max, color) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, category, amount, icon, max, color],
    })),
    'write'
  )

  // Seed tax documents
  const taxDocs = [
    ['1099-NEC (Tech Trophey)', 'Received', 'Jan 5', '48 KB'],
    ['1099-NEC (Hencewood)', 'Received', 'Jan 8', '52 KB'],
    ['Schedule C Draft', 'In Progress', 'Jan 12', '—'],
    ['2023 Tax Return', 'Filed', 'Apr 12', '210 KB'],
    ['W-9 Form', 'Filed', 'Mar 1', '28 KB'],
    ['Estimated Payments', 'In Progress', 'Jan 14', '—'],
  ]
  await db.batch(
    taxDocs.map(([name, status, date, size]) => ({
      sql: `INSERT INTO tax_documents (user_id, name, status, date, size) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, name, status, date, size],
    })),
    'write'
  )

  // Seed calendar events
  const now2 = new Date()
  const y = now2.getFullYear()
  const m = String(now2.getMonth() + 1).padStart(2, '0')
  const d = (n: number) => `${y}-${m}-${String(n).padStart(2, '0')}`
  const events = [
    ['Kick-off Call — Tech Trophey', d(3), '10:00', '11:00', 'meeting', 'Tech Trophey', 'Discuss brand redesign scope and timeline', '#16a34a'],
    ['Invoice INV-090 Due', d(5), null, null, 'deadline', 'Hencewood Digital', 'Payment deadline for API integration project', '#d97706'],
    ['Design Review — Margono', d(7), '14:00', '15:30', 'meeting', 'Margono Studio', 'Present dashboard UI mockups for feedback', '#16a34a'],
    ['Submit final deliverables', d(10), null, null, 'deadline', 'Tech Trophey', 'Final brand assets and style guide', '#d97706'],
    ['Weekly sync — James Park', d(12), '09:00', '09:30', 'meeting', 'Hencewood Digital', 'Regular check-in on project progress', '#16a34a'],
    ['Quarterly tax estimate', d(15), null, null, 'deadline', null, 'Q4 estimated tax payment due', '#dc2626'],
    ['Discovery call — NovaBuild', d(17), '11:00', '12:00', 'meeting', 'NovaBuild', 'First call with Sophie Laurent re: enterprise project', '#16a34a'],
    ['Finish mobile app screens', d(18), null, null, 'task', 'NovaBuild', 'Complete all 12 remaining mobile UI screens', '#16a34a'],
    ['Portfolio update', d(20), null, null, 'task', null, 'Add 3 new case studies to personal site', '#16a34a'],
    ['Proposal deadline — DataSync', d(22), null, null, 'deadline', 'DataSync', 'Send detailed project proposal to Carlos', '#d97706'],
    ['Year-end review call', d(28), '15:00', '16:00', 'meeting', null, 'Internal review of performance and goals', '#16a34a'],
  ]
  await db.batch(
    events.map(([title, date, startTime, endTime, type, client, description, color]) => ({
      sql: `INSERT INTO calendar_events (user_id, title, date, startTime, endTime, type, client, description, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, title, date, startTime, endTime, type, client, description, color],
    })),
    'write'
  )
}

export async function initDb(): Promise<void> {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      website TEXT,
      avatar TEXT,
      color TEXT,
      status TEXT,
      revenue INTEGER DEFAULT 0,
      projects INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS crm_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      website TEXT,
      stage TEXT,
      value INTEGER DEFAULT 0,
      avatar TEXT,
      avatarBg TEXT,
      tags TEXT,
      lastContact TEXT,
      starred INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 0,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT,
      status TEXT,
      dueDate TEXT,
      project TEXT,
      integrations TEXT,
      checked INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      client TEXT NOT NULL,
      project TEXT,
      amount INTEGER DEFAULT 0,
      status TEXT,
      issued TEXT,
      due TEXT,
      avatar TEXT,
      color TEXT,
      PRIMARY KEY (user_id, id)
    )`,
    `CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      company TEXT,
      location TEXT,
      type TEXT,
      budget TEXT,
      posted TEXT,
      tags TEXT,
      description TEXT,
      rating REAL,
      reviews INTEGER,
      saved INTEGER DEFAULT 0,
      applied INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      instructor TEXT,
      category TEXT,
      duration TEXT,
      lessons INTEGER,
      rating REAL,
      progress INTEGER DEFAULT 0,
      enrolled INTEGER DEFAULT 0,
      price INTEGER DEFAULT 0,
      color TEXT,
      badge TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS integrations (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      desc TEXT,
      icon TEXT,
      connected INTEGER DEFAULT 0,
      lastSync TEXT,
      category TEXT,
      color TEXT,
      UNIQUE(user_id, id)
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      author TEXT NOT NULL,
      handle TEXT,
      role TEXT,
      avatar TEXT,
      color TEXT,
      time TEXT,
      trending INTEGER DEFAULT 0,
      content TEXT,
      image TEXT,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      liked INTEGER DEFAULT 0,
      saved INTEGER DEFAULT 0,
      reposted INTEGER DEFAULT 0,
      createdAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS profile (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      displayName TEXT,
      email TEXT,
      headline TEXT,
      skills TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      notifications INTEGER DEFAULT 1,
      twoFactor INTEGER DEFAULT 0,
      darkMode INTEGER DEFAULT 0,
      invoiceAutoSend INTEGER DEFAULT 1,
      weeklyDigest INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS contact_info (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      fullName TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      location TEXT,
      timezone TEXT,
      bio TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tax_deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category TEXT NOT NULL,
      amount INTEGER DEFAULT 0,
      icon TEXT,
      max INTEGER DEFAULT 0,
      color TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tax_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      status TEXT,
      date TEXT,
      size TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      createdAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      type TEXT DEFAULT 'meeting',
      client TEXT,
      description TEXT,
      color TEXT DEFAULT '#16a34a'
    )`,
  ], 'write')

  await seedDemoUser()
}

export default db
