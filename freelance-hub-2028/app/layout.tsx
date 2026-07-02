import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
            background: "rgba(6,9,15,0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}>

            {/* Command search */}
            <div style={{ flex: 1, position: "relative", maxWidth: 340 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input placeholder="Search or ask LanceFlo AI..." className="search-input" />
              <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 3 }}>
                <kbd style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "var(--text-3)", fontFamily: "inherit" }}>⌘</kbd>
                <kbd style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "var(--text-3)", fontFamily: "inherit" }}>K</kbd>
              </div>
            </div>

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
                <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
              </button>

              {/* Workspace selector */}
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "5px 10px",
                background: "var(--glass)",
                border: "1px solid var(--border)",
                borderRadius: 8, cursor: "pointer",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: "linear-gradient(135deg, #00963d, #00e87a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, color: "#020409",
                }}>A</div>
                <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>Acme Studio</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-3)" }}><path d="m6 9 6 6 6-6"/></svg>
              </div>

              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #00963d, #00e87a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#020409", cursor: "pointer",
                boxShadow: "0 0 0 1px rgba(0,232,122,0.25), 0 0 12px rgba(0,232,122,0.18)",
              }}>C</div>
            </div>
          </header>

          <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
