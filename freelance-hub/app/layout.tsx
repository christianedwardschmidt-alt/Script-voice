import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LanceFlo — Freelancer Suite",
  description: "The all-in-one platform for modern freelancers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ minHeight: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Header */}
          <header style={{
            height: 56,
            background: "#ffffff",
            borderBottom: "1px solid rgba(120,100,200,0.1)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}>
            {/* Search */}
            <div style={{ flex: 1, position: "relative", maxWidth: 380 }}>
              <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#3d4a6b", pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input placeholder="Search anything..." className="search-input" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              {/* Notification bell */}
              <button style={{ background: "none", border: "none", color: "#aba8cc", cursor: "pointer", display: "flex", alignItems: "center", padding: 6, borderRadius: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>

              {/* Workspace selector */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px",
                background: "#f5f3ff",
                border: "1px solid #e0d9ff",
                borderRadius: 9, cursor: "pointer",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#fff",
                }}>A</div>
                <span style={{ fontSize: 12.5, color: "#6b6899", fontWeight: 500 }}>Acme Studio</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aba8cc" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>

              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #f472b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer",
                boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
              }}>C</div>
            </div>
          </header>

          <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
