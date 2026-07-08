import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";
import NotificationBell from "@/components/NotificationBell";
import ClientAuthGuard from "@/components/ClientAuthGuard";
import BottomNav from "@/components/BottomNav";
import MobileMenuButton from "@/components/MobileMenuButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Sidebar />

      {/* Main content — offset for fixed sidebar */}
      <div style={{ marginLeft: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <header style={{
          height: 60,
          background: "white",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 0 #F3F4F6",
        }}>
          {/* Left: mobile menu + page title placeholder */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MobileMenuButton />
            <span id="page-title" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "#111827" }} />
          </div>

          {/* Right: bell + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell />
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #14532D, #16A34A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "white",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}>
              {initials}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, background: "#F8FAFC", minHeight: 0 }}>
          {children}
        </main>
      </div>

      <BottomNav />
      <OnboardingModal />
      <ClientAuthGuard />
    </div>
  );
}
