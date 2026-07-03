import { createClient, type InValue, type Row } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:/tmp/lanceflo.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
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

export function logActivity(message: string) {
  // Fire-and-forget — always called after another awaited DB op so client is ready
  client
    .execute({
      sql: 'INSERT INTO activity_log (message, createdAt) VALUES (?, ?)',
      args: [message, new Date().toISOString()],
    })
    .catch(console.error)
}

export async function restoreSeedData(): Promise<void> {
  await ensureReady()
  const tables = [
    'clients', 'crm_clients', 'tasks', 'invoices', 'posts',
    'calendar_events', 'tax_deductions', 'tax_documents', 'activity_log',
    'jobs', 'courses', 'integrations',
  ]
  for (const t of tables) await client.execute(`DELETE FROM ${t}`)
  await seedClients()
  await seedCrmClients()
  await seedTasks()
  await seedInvoices()
  await seedJobs()
  await seedCourses()
  await seedIntegrations()
  await seedPosts()
  await seedTaxDeductions()
  await seedTaxDocuments()
  await seedCalendarEvents()
  await client.execute({
    sql: 'INSERT INTO activity_log (message, createdAt) VALUES (?, ?)',
    args: ['Sample data restored', new Date().toISOString()],
  })
}


// ── Init singleton ───────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __lancefloInit: Promise<void> | undefined
}

function ensureReady(): Promise<void> {
  if (!globalThis.__lancefloInit) globalThis.__lancefloInit = runInit()
  return globalThis.__lancefloInit
}

async function runInit() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, company TEXT NOT NULL, email TEXT, phone TEXT, website TEXT,
        avatar TEXT, color TEXT, status TEXT, revenue INTEGER DEFAULT 0, projects INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS crm_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, company TEXT NOT NULL, email TEXT, phone TEXT, website TEXT,
        stage TEXT, value INTEGER DEFAULT 0, avatar TEXT, avatarBg TEXT,
        tags TEXT, lastContact TEXT, starred INTEGER DEFAULT 0, rating INTEGER DEFAULT 0, notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, description TEXT, priority TEXT, status TEXT,
        dueDate TEXT, project TEXT, integrations TEXT, checked INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY, client TEXT NOT NULL, project TEXT,
        amount INTEGER DEFAULT 0, status TEXT, issued TEXT, due TEXT, avatar TEXT, color TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, company TEXT, location TEXT, type TEXT, budget TEXT, posted TEXT,
        tags TEXT, description TEXT, rating REAL, reviews INTEGER,
        saved INTEGER DEFAULT 0, applied INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, instructor TEXT, category TEXT, duration TEXT, lessons INTEGER,
        rating REAL, progress INTEGER DEFAULT 0, enrolled INTEGER DEFAULT 0,
        price INTEGER DEFAULT 0, color TEXT, badge TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, desc TEXT, icon TEXT,
        connected INTEGER DEFAULT 0, lastSync TEXT, category TEXT, color TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL, handle TEXT, role TEXT, avatar TEXT, color TEXT,
        time TEXT, trending INTEGER DEFAULT 0, content TEXT, image TEXT,
        likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, shares INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0, liked INTEGER DEFAULT 0, saved INTEGER DEFAULT 0,
        reposted INTEGER DEFAULT 0, createdAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY,
        displayName TEXT, email TEXT, headline TEXT, skills TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        notifications INTEGER DEFAULT 1, twoFactor INTEGER DEFAULT 0,
        darkMode INTEGER DEFAULT 0, invoiceAutoSend INTEGER DEFAULT 1,
        weeklyDigest INTEGER DEFAULT 1, workspaceName TEXT DEFAULT 'My Studio'
      )`,
      `CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY,
        fullName TEXT, email TEXT, phone TEXT, website TEXT, location TEXT, timezone TEXT, bio TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL, amount INTEGER DEFAULT 0, icon TEXT, max INTEGER DEFAULT 0, color TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tax_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, status TEXT, date TEXT, size TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL, createdAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, date TEXT NOT NULL, startTime TEXT, endTime TEXT,
        type TEXT DEFAULT 'meeting', client TEXT, description TEXT, color TEXT DEFAULT '#5b5fcf'
      )`,
    ],
    'write'
  )

  // Migration: add workspaceName to existing settings tables (no-op if already present)
  await client
    .execute(`ALTER TABLE settings ADD COLUMN workspaceName TEXT DEFAULT 'My Studio'`)
    .catch(() => {})

  // Only seed on first-ever run — settings row existing means the user has been here before
  const hasSettings = await client.execute(`SELECT id FROM settings WHERE id = 1`)
  if (!hasSettings.rows.length) {
    await seedAll()
  }
}

async function seedAll() {
  await seedClients()
  await seedCrmClients()
  await seedTasks()
  await seedInvoices()
  await seedJobs()
  await seedCourses()
  await seedIntegrations()
  await seedPosts()
  await seedProfile()
  await seedSettings()
  await seedContactInfo()
  await seedTaxDeductions()
  await seedTaxDocuments()
  await seedActivityLog()
  await seedCalendarEvents()
}

// ── Seed functions ───────────────────────────────────────────────────────────

async function seedClients() {
  const sql = `INSERT INTO clients (name,company,email,phone,website,avatar,color,status,revenue,projects) VALUES (?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Emma Thompson','Tech Trophey','emma@techtrophey.com','+1 (555) 234-5678','techtrophey.com','👩🏻‍💼','#16a34a','active',24500,5] },
    { sql, args: ['James Park','Hencewood Digital','james@hencewood.io','+1 (555) 345-6789','hencewood.io','👨🏻‍💻','#ec4899','active',18200,3] },
    { sql, args: ['Aisha Williams','Margono Studio','aisha@margono.co','+1 (555) 456-7890','margono.co','👩🏿‍💼','#f59e0b','active',15800,4] },
  ], 'write')
}

async function seedCrmClients() {
  const sql = `INSERT INTO crm_clients (name,company,email,phone,website,stage,value,avatar,avatarBg,tags,lastContact,starred,rating,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Emma Thompson','Acme Corp','emma@acmecorp.com','+1 (555) 234-5678','acmecorp.com','Active',18500,'👩🏻‍💼','#16a34a',JSON.stringify(['Design','Retainer']),'1h ago',1,5,'Long-term client. Pays on time. Expanding to mobile app.'] },
    { sql, args: ['James Park','TechFlow Inc','jpark@techflow.io','+1 (555) 345-6789','techflow.io','Proposal',12000,'👨🏻‍💻','#22c55e',JSON.stringify(['Development','API']),'3h ago',0,4,'Needs detailed scope. Budget is flexible if scope is clear.'] },
    { sql, args: ['Aisha Williams','Bright Ideas Co','aisha@brightideas.co','+1 (555) 456-7890','brightideas.co','Negotiation',9800,'👩🏿‍💼','#d97706',JSON.stringify(['Marketing','Content']),'1d ago',1,4,'Negotiating on timeline. They want delivery in 3 weeks.'] },
    { sql, args: ['Carlos Mendez','DataSync','carlos@datasync.io','+1 (555) 567-8901','datasync.io','Active',24000,'👨🏽‍💼','#14b8a6',JSON.stringify(['Development','Data','Premium']),'2d ago',0,5,'High-value client. Careful with deadlines. C-level contacts.'] },
    { sql, args: ['Sophie Laurent','NovaBuild','sophie@novabuild.fr','+33 1 23 45 67 89','novabuild.fr','Lead',35000,'👩🏻‍🎨','#78716c',JSON.stringify(['Design','Enterprise','New']),'3d ago',1,3,'Warm lead from LinkedIn. Need to schedule discovery call.'] },
    { sql, args: ['Raj Patel','InnovateTech','raj@innovatetech.in','+91 98765 43210','innovatetech.in','Completed',8200,'👨🏽‍💻','#4ade80',JSON.stringify(['Development','Completed']),'2w ago',0,4,'Project completed successfully. Ask for referral.'] },
  ], 'write')
}

async function seedTasks() {
  const sql = `INSERT INTO tasks (title,description,priority,status,dueDate,project,integrations,checked) VALUES (?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Complete website redesign mockups','Create high-fidelity mockups for the client homepage and product pages','high','in progress','Jan 14','Tech Trophey Website',JSON.stringify(['figma','slack','google']),0] },
    { sql, args: ['Review frontend code pull request','Check the new React components for best practices','medium','todo','Jan 12','Hencewood Digital',JSON.stringify(['github','slack']),0] },
    { sql, args: ['Client meeting - Project kickoff','Discuss project scope and timeline with new client','high','todo','Jan 11','Margono Studio',JSON.stringify(['slack']),0] },
    { sql, args: ['Update portfolio website','Add recent case studies and update project showcase','low','todo','Jan 20','Personal',JSON.stringify([]),0] },
  ], 'write')
}

async function seedInvoices() {
  const sql = `INSERT INTO invoices (id,client,project,amount,status,issued,due,avatar,color) VALUES (?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['INV-089','Tech Trophey','Brand Redesign Q4',4800,'Paid','Nov 15','Dec 15','👩🏻‍💼','#16a34a'] },
    { sql, args: ['INV-090','Hencewood Digital','API Integration',3200,'Pending','Dec 1','Jan 1','👨🏻‍💻','#ec4899'] },
    { sql, args: ['INV-088','Margono Studio','Dashboard UI',8400,'Overdue','Oct 20','Nov 20','👩🏿‍💼','#f59e0b'] },
    { sql, args: ['INV-091','NovaBuild','Mobile App',2100,'Draft','Dec 20','Jan 20','👨🏽‍💼','#10b981'] },
  ], 'write')
}

async function seedJobs() {
  const sql = `INSERT INTO jobs (title,company,location,type,budget,posted,tags,description,rating,reviews,saved,applied) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Senior UI/UX Designer','Stripe','Remote','Contract','$120–160/hr','2h ago',JSON.stringify(['Figma','Design Systems','React']),'Looking for an experienced designer to lead our dashboard redesign. 3-month engagement.',4.9,24,0,0] },
    { sql, args: ['Full Stack Next.js Developer','Vercel','Remote','Project','$18,000 fixed','5h ago',JSON.stringify(['Next.js','TypeScript','PostgreSQL']),'Build a SaaS analytics platform from scratch. Solo project, 2 months timeline.',4.7,18,1,0] },
    { sql, args: ['Brand Identity Designer','Linear','Hybrid','Contract','$90–110/hr','1d ago',JSON.stringify(['Branding','Illustration','Motion']),'Refreshing our brand identity. Need a creative who understands B2B SaaS.',4.8,31,0,0] },
    { sql, args: ['React Native Developer','Notion','Remote','Retainer','$8,500/mo','2d ago',JSON.stringify(['React Native','iOS','Android']),'Ongoing mobile app development. 20 hrs/week retainer arrangement.',5.0,12,0,0] },
  ], 'write')
}

async function seedCourses() {
  const sql = `INSERT INTO courses (title,instructor,category,duration,lessons,rating,progress,enrolled,price,color,badge) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Advanced Figma for Freelancers','Sarah Chen','Design','8h 30m',42,4.9,65,1,0,'#16a34a','Free'] },
    { sql, args: ['Full-Stack Next.js','Marcus Williams','Development','22h',95,4.8,30,1,79,'#10b981','Bestseller'] },
    { sql, args: ['AI Tools for Freelancers','Priya Sharma','AI & ML','6h 45m',28,4.9,0,0,49,'#f59e0b','New'] },
    { sql, args: ['Freelance Business Mastery','James Rodriguez','Business','11h',56,4.7,100,1,89,'#ec4899',null] },
    { sql, args: ['UX Research & Testing','Aisha Johnson','Design','9h',38,4.8,0,0,59,'#06b6d4','Popular'] },
    { sql, args: ['Content Marketing','Tom Blake','Marketing','7h 50m',33,4.6,0,0,39,'#78716c',null] },
  ], 'write')
}

async function seedIntegrations() {
  const sql = `INSERT INTO integrations (id,name,desc,icon,connected,lastSync,category,color) VALUES (?,?,?,?,?,?,?,?)`
  await client.batch([
    { sql, args: ['ms365','Microsoft 365','Word, Excel, PowerPoint, Outlook & Teams','🪟',1,'2 min ago','Productivity','#0078d4'] },
    { sql, args: ['notion','Notion','All-in-one workspace for notes and docs','◼',1,'5 min ago','Productivity','#1c1917'] },
    { sql, args: ['slack','Slack','Team communication and collaboration','💬',1,'1 min ago','Productivity','#4a154b'] },
    { sql, args: ['figma','Figma','Collaborative design and prototyping','🎨',1,'10 min ago','Design','#f24e1e'] },
    { sql, args: ['adobe','Adobe Creative Cloud','Photoshop, Illustrator, XD & more','🔴',0,null,'Design','#ff0000'] },
    { sql, args: ['github','GitHub','Version control and code collaboration','🐙',1,'3 min ago','Development','#1c1917'] },
    { sql, args: ['vscode','VS Code','Code editor with extensions and sync','💙',1,'15 min ago','Development','#007acc'] },
    { sql, args: ['vercel','Vercel','Frontend deployment and edge network','▲',0,null,'Development','#1c1917'] },
    { sql, args: ['stripe','Stripe','Payment processing and subscriptions','💳',1,'1 min ago','Finance','#6772e5'] },
    { sql, args: ['wise','Wise','International transfers and multi-currency','🌍',1,'20 min ago','Finance','#9fe870'] },
    { sql, args: ['quickbooks','QuickBooks','Accounting software for freelancers','📊',0,null,'Finance','#2ca01c'] },
    { sql, args: ['canva','Canva','Quick design tool for social media','🖼',0,null,'Design','#00c4cc'] },
  ], 'write')
}

async function seedPosts() {
  const sql = `INSERT INTO posts (author,handle,role,avatar,color,time,trending,content,image,likes,comments,shares,views,liked,saved,reposted,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  const now = Date.now()
  await client.batch([
    { sql, args: ['Sarah Johnson','@sarahj_ux','Senior UI/UX Designer','👩🏻‍🎨','#16a34a','2h',1,'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off.\n\nHere\'s what worked for me:\n→ Niching down to SaaS dashboards only\n→ Cold outreach with a custom Loom video\n→ Packaging services at 3 clear price points\n\nThe journey is everything. Keep going. 💜',JSON.stringify({type:'design',label:'Dashboard Redesign Preview',emoji:'🖥',grad:'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)'}),142,38,21,8400,0,0,0,new Date(now - 2*3600000).toISOString()] },
    { sql, args: ['Marcus Williams','@marcusdev','Full Stack Developer','👨🏾‍💻','#10b981','5h',0,'Hot take: The single best thing I did for my freelance career was raising my rates.\n\nWent from $85/hr → $150/hr and actually got MORE serious clients.\n\nPrice is a signal. Premium pricing filters out problem clients automatically.',JSON.stringify({type:'chart',label:'Revenue Growth 2025→2026',emoji:'📈',grad:'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)'}),287,64,89,21300,1,0,0,new Date(now - 5*3600000).toISOString()] },
    { sql, args: ['Priya Sharma','@priya_uxr','UX Researcher','👩🏽‍💻','#f59e0b','1d',0,'Sharing my freelance contract template — took me 2 years and one bad client experience to get right.\n\nIncludes:\n✅ Scope of work clauses\n✅ Revision limits\n✅ Kill fee (25% if client cancels)\n✅ IP ownership on final payment',null,512,97,203,34100,0,1,0,new Date(now - 24*3600000).toISOString()] },
    { sql, args: ['Tom Blake','@tomblake_brand','Brand Strategist','👨🏼‍💼','#06b6d4','2d',0,'My home office setup after 3 years of freelancing. The monitor arm was a game changer. 🖥\n\nTools I swear by:\n• Standing desk (health investment)\n• Good mic (clients notice)\n• Notion + LanceFlo for project tracking',JSON.stringify({type:'photo',label:'Home Office Setup',emoji:'🖥',grad:'linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)'}),94,41,7,5200,0,0,1,new Date(now - 48*3600000).toISOString()] },
  ], 'write')
}

async function seedProfile() {
  await client.execute({
    sql: `INSERT INTO profile (id,displayName,email,headline,skills) VALUES (1,?,?,?,?)`,
    args: ['Christian Schmidt','christian@freelance.io','Full Stack Developer & UI Designer','React, TypeScript, Figma, Next.js'],
  })
}

async function seedSettings() {
  await client.execute({
    sql: `INSERT INTO settings (id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName) VALUES (1,1,0,0,1,1,?)`,
    args: ['Acme Studio'],
  })
}

async function seedContactInfo() {
  await client.execute({
    sql: `INSERT INTO contact_info (id,fullName,email,phone,website,location,timezone,bio) VALUES (1,?,?,?,?,?,?,?)`,
    args: ['Christian Schmidt','christian@freelance.io','+1 (555) 000-0000','yoursite.com','San Francisco, CA','PST (UTC-8)',''],
  })
}

async function seedTaxDeductions() {
  const sql = `INSERT INTO tax_deductions (category,amount,icon,max,color) VALUES (?,?,?,?,?)`
  await client.batch([
    { sql, args: ['Home Office',3600,'🏠',5400,'#16a34a'] },
    { sql, args: ['Software & Tools',2840,'💻',5400,'#ec4899'] },
    { sql, args: ['Health Insurance',5400,'🏥',5400,'#10b981'] },
    { sql, args: ['Equipment',4100,'🖥',5400,'#f59e0b'] },
    { sql, args: ['Education',1200,'📚',5400,'#06b6d4'] },
    { sql, args: ['Internet & Phone',960,'📡',5400,'#78716c'] },
  ], 'write')
}

async function seedTaxDocuments() {
  const sql = `INSERT INTO tax_documents (name,status,date,size) VALUES (?,?,?,?)`
  await client.batch([
    { sql, args: ['1099-NEC (Tech Trophey)','Received','Jan 5','48 KB'] },
    { sql, args: ['1099-NEC (Hencewood)','Received','Jan 8','52 KB'] },
    { sql, args: ['Schedule C Draft','In Progress','Jan 12','—'] },
    { sql, args: ['2023 Tax Return','Filed','Apr 12','210 KB'] },
    { sql, args: ['W-9 Form','Filed','Mar 1','28 KB'] },
    { sql, args: ['Estimated Payments','In Progress','Jan 14','—'] },
  ], 'write')
}

async function seedActivityLog() {
  await client.execute({
    sql: `INSERT INTO activity_log (message,createdAt) VALUES (?,?)`,
    args: ['Welcome to LanceFlo — your workspace is ready', new Date().toISOString()],
  })
}

async function seedCalendarEvents() {
  const sql = `INSERT INTO calendar_events (title,date,startTime,endTime,type,client,description,color) VALUES (?,?,?,?,?,?,?,?)`
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = (n: number) => `${y}-${m}-${String(n).padStart(2, '0')}`
  await client.batch([
    { sql, args: ['Kick-off Call — Tech Trophey', d(3),'10:00','11:00','meeting','Tech Trophey','Discuss brand redesign scope and timeline','#5b5fcf'] },
    { sql, args: ['Invoice INV-090 Due', d(5),null,null,'deadline','Hencewood Digital','Payment deadline for API integration project','#d97706'] },
    { sql, args: ['Design Review — Margono', d(7),'14:00','15:30','meeting','Margono Studio','Present dashboard UI mockups for feedback','#5b5fcf'] },
    { sql, args: ['Submit final deliverables', d(10),null,null,'deadline','Tech Trophey','Final brand assets and style guide','#d97706'] },
    { sql, args: ['Weekly sync — James Park', d(12),'09:00','09:30','meeting','Hencewood Digital','Regular check-in on project progress','#5b5fcf'] },
    { sql, args: ['Quarterly tax estimate', d(15),null,null,'deadline',null,'Q4 estimated tax payment due','#dc2626'] },
    { sql, args: ['Discovery call — NovaBuild', d(17),'11:00','12:00','meeting','NovaBuild','First call with Sophie Laurent re: enterprise project','#5b5fcf'] },
    { sql, args: ['Finish mobile app screens', d(18),null,null,'task','NovaBuild','Complete all 12 remaining mobile UI screens','#00b857'] },
    { sql, args: ['Portfolio update', d(20),null,null,'task',null,'Add 3 new case studies to personal site','#00b857'] },
    { sql, args: ['Proposal deadline — DataSync', d(22),null,null,'deadline','DataSync','Send detailed project proposal to Carlos','#d97706'] },
    { sql, args: ['Year-end review call', d(28),'15:00','16:00','meeting',null,'Internal review of 2028 performance and 2029 goals','#5b5fcf'] },
  ], 'write')
}
