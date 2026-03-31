"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";

type Tab = "dashboard" | "card-designer" | "profile" | "guardian" | "messages" | "safety";

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
  mobileLabel: string;
  mobileIcon: string;
}

function getNavItems(gender?: string | null): NavItem[] {
  const guardianLabel = gender === "sister" ? "Guardian (Wali)" : "Trusted Elder";
  const guardianMobile = gender === "sister" ? "Guardian" : "Elder";
  return [
    { id: "dashboard",     label: "Dashboard",       icon: "dashboard",     mobileLabel: "Home",          mobileIcon: "home" },
    { id: "card-designer", label: "Card Customizer", icon: "palette",       mobileLabel: "Card",          mobileIcon: "palette" },
    { id: "profile",       label: "Profile",         icon: "person",        mobileLabel: "Edit",          mobileIcon: "edit_document" },
    { id: "guardian",      label: guardianLabel,      icon: "shield_person", mobileLabel: guardianMobile,  mobileIcon: "security" },
    { id: "messages",      label: "Messages",        icon: "chat_bubble",   mobileLabel: "Chat",          mobileIcon: "chat_bubble" },
    { id: "safety",        label: "Safety",          icon: "lock",          mobileLabel: "Safety",        mobileIcon: "emergency_home" },
  ];
}

interface Props {
  email: string;
  pendingCount: number;
  gender?: string | null;
  sections: Record<Tab, ReactNode>;
}

const VALID_TABS: Tab[] = ["dashboard", "card-designer", "profile", "guardian", "messages", "safety"];

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  if (VALID_TABS.includes(hash as Tab)) return hash as Tab;
  return "dashboard";
}

export default function DashboardShell({ email, pendingCount, gender, sections }: Props) {
  const navItems = getNavItems(gender);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [notifCount, setNotifCount] = useState(pendingCount);

  useEffect(() => {
    setActiveTab(getInitialTab());

    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (VALID_TABS.includes(hash as Tab)) {
        setActiveTab(hash as Tab);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Poll notification count every 30 seconds
  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setNotifCount(data.count);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifCount]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Refresh notification count on tab switch
    fetchNotifCount();
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full py-8 px-4 bg-sanctuary-surface w-64 z-40">
        <div className="mb-10 px-4">
          <h1 className="font-serif text-lg text-sanctuary-primary">Proposal Card</h1>
          <p className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                activeTab === item.id
                  ? "text-sanctuary-primary border-r-2 border-sanctuary-primary bg-sanctuary-surface-low"
                  : "text-sanctuary-outline hover:text-sanctuary-primary hover:bg-sanctuary-surface-low"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
              {item.id === "messages" && notifCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-sanctuary-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4">
          <form action="/api/auth/logout" method="POST">
            <button className="w-full py-3 px-4 text-sm text-sanctuary-outline hover:text-sanctuary-tertiary transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Top Navigation — mobile-safe */}
      <header className="sticky top-0 z-50 bg-sanctuary-surface lg:ml-64">
        <div className="flex items-center justify-between px-4 md:px-6 h-14 max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-serif font-bold text-sanctuary-primary shrink-0">
            Proposal Card
          </h2>
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification bell — always visible, min 44px tap target */}
            <button
              onClick={() => switchTab("messages")}
              className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-sanctuary-surface-low transition-colors"
            >
              <span className="material-symbols-outlined text-sanctuary-on-surface">notifications</span>
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-sanctuary-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {/* Email — hidden on mobile */}
            <span className="hidden md:block text-sm text-sanctuary-outline truncate max-w-[200px]">{email}</span>
          </div>
        </div>
        <div className="bg-sanctuary-surface-low h-px w-full" />
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 px-4 md:px-6 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-10 pb-24 lg:pb-10">
        {sections[activeTab]}
      </main>

      {/* Bottom Navigation (Mobile) — 44px min tap targets */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-2 bg-sanctuary-surface/90 backdrop-blur-md border-t border-sanctuary-outline-variant/15 z-50">
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => switchTab(item.id)}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 rounded-lg transition-colors ${
              activeTab === item.id ? "text-sanctuary-primary" : "text-sanctuary-outline"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.mobileIcon}</span>
            <span className="text-[9px] uppercase tracking-tighter leading-tight mt-0.5">{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
