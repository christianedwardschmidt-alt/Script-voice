import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | GuildWire',
    default: 'GuildWire — The Operating System for Independent Professionals',
  },
  description: 'CRM, invoicing, AI companion, and community for serious independent professionals. Keep 97% of what you earn. Join as a founding member.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
