import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/tasks', '/clients', '/crm', '/invoicing', '/insights', '/ai-assistant', '/settings', '/profile', '/tax', '/integrations', '/calendar', '/jobs', '/education', '/community', '/contact', '/api/'] },
    sitemap: 'https://guildwire.io/sitemap.xml',
    host: 'https://guildwire.io',
  }
}
