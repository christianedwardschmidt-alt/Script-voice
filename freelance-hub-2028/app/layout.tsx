import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuildWire 2028 — Freelancer Suite",
  description: "Work free. Stay wired. — The intelligent platform for modern freelancers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}
