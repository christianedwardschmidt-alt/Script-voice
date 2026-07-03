import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LanceFlo 2028 — Freelancer Suite",
  description: "The intelligent platform for modern freelancers",
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
            background: "rgba(255,255,255,0.92)",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}>

            {/* Command search */}
            <SearchBar />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>

              {/* AI status */}
              <div className="ai-chip ai-pulse">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                AI active
              </div>

              {/* Bell */}
              <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 6, borderRadius: 8, position: "relative" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--green)" }} />
              </button>

              {/* Workspace selector */}
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "5px 10px",
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                borderRadius: 8, cursor: "pointer",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: "linear-gradient(135deg, #007a3a, #00b857)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, color: "#fff",
                }}>A</div>
                <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>Acme Studio</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-3)" }}><path d="m6 9 6 6 6-6"/></svg>
              </div>

              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #007a3a, #00b857)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#fff", cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}>C</div>
            </div>
          </header>

          <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
