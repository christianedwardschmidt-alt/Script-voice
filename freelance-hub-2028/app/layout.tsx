import type { Metadata } from "next";
import { Syne, Inter } from 'next/font/google'
import "./globals.css";

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const SITE_URL = 'https://guildwire.io'
const TITLE    = 'GuildWire — The Operating System for Independent Professionals'
const DESC     = 'GuildWire is the all-in-one platform for freelancers: CRM, invoicing, AI assistant, tax tools, and a professional community. Keep 97% of what you earn. Join free.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | GuildWire',
    default: TITLE,
  },
  description: DESC,
  keywords: ['GuildWire', 'Guild Wire', 'freelancer platform', 'freelance CRM', 'freelance invoicing', 'independent professional', 'freelancer tools', 'freelance management', 'self-employed software'],
  authors: [{ name: 'GuildWire', url: SITE_URL }],
  creator: 'GuildWire',
  publisher: 'GuildWire',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'GuildWire',
    title: TITLE,
    description: DESC,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@guildwire',
    creator: '@guildwire',
    title: TITLE,
    description: DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GuildWire',
  alternateName: 'Guild Wire',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  description: DESC,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web',
  creator: { '@type': 'Organization', name: 'GuildWire', url: SITE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
