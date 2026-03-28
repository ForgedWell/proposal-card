"use client";

import { ReactNode, useState, useEffect } from "react";

type Tab = "dashboard" | "card-designer" | "profile" | "guardian" | "safety";

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
  mobileLabel: string;
  mobileIcon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",     label: "Dashboard",         icon: "dashboard",     mobileLabel: "Home",     mobileIcon: "home" },
  { id: "card-designer", label: "Card Customizer",   icon: "palette",       mobileLabel: "Card",     mobileIcon: "palette" },
  { id: "profile",       label: "Profile",           icon: "person",        mobileLabel: "Edit",     mobileIcon: "edit_document" },
  { id: "guardian",      label: "Guardian Settings",  icon: "shield_person", mobileLabel: "Guardian", mobileIcon: "security" },
  { id: "safety",        label: "Safety",            icon: "lock",          mobileLabel: "Safety",   mobileIcon: "emergency_home" },
];

interface Props {
  email: string;
  pendingCount: number;
  sections: Record<Tab, ReactNode>;
}

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  if (NAV_ITEMS.some(n => n.id === hash)) return hash as Tab;
  return "dashboard";
}

export default function DashboardShell({ email, pendingCount, sections }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Read hash on mount
  useEffect(() => {
    setActiveTab(getInitialTab());

    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (NAV_ITEMS.some(n => n.id === hash)) {
        setActiveTab(hash as Tab);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          {NAV_ITEMS.map(item => (
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

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-sanctuary-surface lg:ml-64">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-bold text-sanctuary-primary">Proposal Card</h2>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <button onClick={() => switchTab("dashboard")} className="relative">
                <span className="material-symbols-outlined text-sanctuary-on-surface">notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sanctuary-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </button>
            )}
            <span className="text-sm text-sanctuary-outline">{email}</span>
          </div>
        </div>
        <div className="bg-sanctuary-surface-low h-px w-full" />
      </header>

      {/* Main Content — only active section visible */}
      <main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-24 lg:pb-10">
        {sections[activeTab]}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-sanctuary-surface/80 backdrop-blur-md border-t border-sanctuary-outline-variant/15 z-50 rounded-t-xl">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => switchTab(item.id)}
            className={`flex flex-col items-center transition-colors ${
              activeTab === item.id ? "text-sanctuary-primary" : "text-sanctuary-outline"
            }`}
          >
            <span className="material-symbols-outlined">{item.mobileIcon}</span>
            <span className="text-[10px] uppercase tracking-tighter">{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
