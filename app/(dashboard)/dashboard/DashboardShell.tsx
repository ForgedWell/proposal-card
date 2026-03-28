"use client";

import { ReactNode } from "react";

interface Props {
  email: string;
  pendingCount: number;
  children: ReactNode;
}

export default function DashboardShell({ email, pendingCount, children }: Props) {
  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full py-8 px-4 bg-sanctuary-surface w-64 z-40">
        <div className="mb-10 px-4">
          <h1 className="font-serif text-lg text-sanctuary-primary">Proposal Card</h1>
          <p className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sanctuary-primary border-r-2 border-sanctuary-primary bg-sanctuary-surface-low">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-medium text-sm">Dashboard</span>
          </a>
          <a href="#card-designer" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sanctuary-outline hover:text-sanctuary-primary hover:bg-sanctuary-surface-low transition-colors">
            <span className="material-symbols-outlined">palette</span>
            <span className="font-medium text-sm">Card Customizer</span>
          </a>
          <a href="#profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sanctuary-outline hover:text-sanctuary-primary hover:bg-sanctuary-surface-low transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="font-medium text-sm">Profile</span>
          </a>
          <a href="#guardian" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sanctuary-outline hover:text-sanctuary-primary hover:bg-sanctuary-surface-low transition-colors">
            <span className="material-symbols-outlined">shield_person</span>
            <span className="font-medium text-sm">Guardian Settings</span>
          </a>
          <a href="#safety" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sanctuary-outline hover:text-sanctuary-primary hover:bg-sanctuary-surface-low transition-colors">
            <span className="material-symbols-outlined">lock</span>
            <span className="font-medium text-sm">Safety</span>
          </a>
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
              <span className="relative">
                <span className="material-symbols-outlined text-sanctuary-on-surface">notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sanctuary-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </span>
            )}
            <span className="text-sm text-sanctuary-outline">{email}</span>
          </div>
        </div>
        <div className="bg-sanctuary-surface-low h-px w-full" />
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-24 lg:pb-10">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-sanctuary-surface/80 backdrop-blur-md border-t border-sanctuary-outline-variant/15 z-50 rounded-t-xl">
        <a href="#" className="flex flex-col items-center text-sanctuary-primary">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] uppercase tracking-tighter">Home</span>
        </a>
        <a href="#profile" className="flex flex-col items-center text-sanctuary-outline">
          <span className="material-symbols-outlined">edit_document</span>
          <span className="text-[10px] uppercase tracking-tighter">Edit</span>
        </a>
        <a href="#guardian" className="flex flex-col items-center text-sanctuary-outline">
          <span className="material-symbols-outlined">security</span>
          <span className="text-[10px] uppercase tracking-tighter">Guardian</span>
        </a>
        <a href="#safety" className="flex flex-col items-center text-sanctuary-outline">
          <span className="material-symbols-outlined">emergency_home</span>
          <span className="text-[10px] uppercase tracking-tighter">Safety</span>
        </a>
      </nav>
    </div>
  );
}
