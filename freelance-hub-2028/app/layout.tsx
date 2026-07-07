import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuildWire 2028 — Freelancer Suite",
  description: "Work free. Get connected. — The intelligent platform for modern freelancers.",
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
