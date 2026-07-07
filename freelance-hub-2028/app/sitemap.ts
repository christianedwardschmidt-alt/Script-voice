import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://guildwire.io'
  const now = new Date()
  return [
    { url: base,           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/login`,  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
