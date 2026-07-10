import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { Star, Users2, ArrowRight, Sparkles } from 'lucide-react'

interface MarketplaceAgentPublic {
  id: number
  name: string
  slug: string
  description: string
  category: string
  configuration: string
  submitted_by_profession: string
  clone_count: number
  average_rating: number
  rating_count: number
  created_at: string
}

async function getAgent(slug: string): Promise<MarketplaceAgentPublic | null> {
  return queryOne<MarketplaceAgentPublic>(
    `SELECT id, name, slug, description, category, configuration, submitted_by_profession, clone_count, average_rating, rating_count, created_at
     FROM marketplace_agents WHERE slug = ? AND approved = 1`,
    [slug]
  )
}

function hasConditionalLogic(configurationJson: string): boolean {
  try {
    const config = JSON.parse(configurationJson) as { actions?: unknown[] }
    return Array.isArray(config.actions) && config.actions.some(a => !!a && typeof a === 'object' && (a as { type?: string }).type === 'rule')
  } catch {
    return false
  }
}

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const agent = await getAgent(slug)
  if (!agent) return { title: 'Agent not found — GuildWire Marketplace' }
  return {
    title: `${agent.name} — Free GuildWire Marketplace Agent`,
    description: agent.description,
    alternates: { canonical: `https://guildwire.io/marketplace/${agent.slug}` },
    openGraph: {
      title: agent.name,
      description: agent.description,
      url: `https://guildwire.io/marketplace/${agent.slug}`,
      type: 'website',
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  Invoicing: '#16A34A',
  'Client Relations': '#EC4899',
  Tax: '#CA8A04',
  Proposals: '#6366F1',
  Productivity: '#8B5CF6',
  Community: '#14B8A6',
}

export default async function PublicMarketplaceAgentPage({ params }: Params) {
  const { slug } = await params
  const agent = await getAgent(slug)
  if (!agent) notFound()

  const color = CATEGORY_COLORS[agent.category] ?? '#16A34A'
  const isSmart = hasConditionalLogic(agent.configuration)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'var(--font-syne, sans-serif)', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Guild<span style={{ color: '#16A34A' }}>Wire</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 560, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', padding: 40, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 11px', borderRadius: 20, background: `${color}14`, color, fontFamily: 'var(--font-inter, sans-serif)' }}>
              {agent.category}
            </span>
            {isSmart && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                padding: '3px 11px 3px 9px', borderRadius: 20, background: 'rgba(202,138,4,0.12)', color: '#92650A',
                fontFamily: 'var(--font-inter, sans-serif)',
              }}>
                <Sparkles size={11} color="#CA8A04" fill="#CA8A04" />
                Smart Agent
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-syne, sans-serif)', fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            {agent.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-inter, sans-serif)', fontSize: 16, color: '#4B5563', lineHeight: 1.6, margin: '0 0 24px' }}>
            {agent.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-inter, sans-serif)' }}>
              <Users2 size={14} /> Used by {agent.clone_count} member{agent.clone_count === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-inter, sans-serif)' }}>
              <Star size={14} color="#CA8A04" fill="#CA8A04" />
              {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : 'New'}
              {agent.rating_count > 0 ? ` (${agent.rating_count})` : ''}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Shared by a {agent.submitted_by_profession || 'GuildWire member'}
            </div>
          </div>

          <Link
            href={`/signup?marketplace=${agent.slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0',
              borderRadius: 10, background: '#16A34A', color: '#fff', fontFamily: 'var(--font-inter, sans-serif)',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}
          >
            Use this agent free for 30 days — no card required
            <ArrowRight size={15} />
          </Link>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: '12px 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
            Built by an independent professional on GuildWire.
          </p>
        </div>
      </main>
    </div>
  )
}
