import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import QuickActions from "@/components/QuickActions";
import OnboardingModal from "@/components/OnboardingModal";
import NotificationBell from "@/components/NotificationBell";
import WorkspaceSelector from "@/components/WorkspaceSelector";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuildWire 2028 — Freelancer Suite",
  description: "Work free. Stay wired. — The intelligent platform for modern freelancers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ minHeight: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Header */}
          <header style={{
            height: 52,
            background: "var(--header-bg)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)",
          }}>

            {/* Command search */}
            <SearchBar />

            {/* Quick Add */}
            <QuickActions />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

              {/* AI status */}
              <div className="ai-chip ai-pulse">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                AI active
              </div>

              {/* Bell */}
              <NotificationBell />

              {/* Workspace selector */}
              <WorkspaceSelector />
            </div>
          </header>

          <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
        </div>

        <OnboardingModal />
      </body>
    </html>
  );
}
