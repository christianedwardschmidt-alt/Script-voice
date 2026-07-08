import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import QuickActions from "@/components/QuickActions";
import OnboardingModal from "@/components/OnboardingModal";
import NotificationBell from "@/components/NotificationBell";
import WorkspaceSelector from "@/components/WorkspaceSelector";
import ClientAuthGuard from "@/components/ClientAuthGuard";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--app-bg)", color: "var(--text)" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <header style={{
          height: 60,
          background: "rgba(255,255,255,0.97)",
          borderBottom: "1px solid var(--gray-100)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 10,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <SearchBar />
          <div className="hide-mobile"><QuickActions /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="ai-chip ai-pulse hide-mobile">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              AI active
            </div>
            <NotificationBell />
            <div className="hide-mobile"><WorkspaceSelector /></div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: "auto", background: "var(--app-bg)", minHeight: 0 }}>{children}</main>
      </div>

      <BottomNav />
      <OnboardingModal />
      <ClientAuthGuard />
    </div>
  );
}
