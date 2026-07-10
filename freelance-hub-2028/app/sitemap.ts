import type { MetadataRoute } from 'next'
import { queryAll } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://guildwire.io'
  const now = new Date()

  const marketplaceAgents = await queryAll<{ slug: string; created_at: string }>(
    `SELECT slug, created_at FROM marketplace_agents WHERE approved = 1`
  ).catch(() => [])

  return [
    { url: base,           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/login`,  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...marketplaceAgents.map(a => ({
      url: `${base}/marketplace/${a.slug}`,
      lastModified: new Date(a.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
