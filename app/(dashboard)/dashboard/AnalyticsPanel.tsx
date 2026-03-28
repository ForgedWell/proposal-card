"use client";

import { useState, useEffect, useRef } from "react";

interface AnalyticsPanelProps {
  scanCount: number;
  pendingCount: number;
  approvedCount: number;
  activeProxyCount: number;
}

const POLL_INTERVAL = 30000;

const STATS_CONFIG = [
  { key: "scanCount" as const, label: "Card Views", icon: "visibility", sub: "Total views" },
  { key: "pendingCount" as const, label: "Pending", icon: "hourglass_top", sub: "Awaiting review" },
  { key: "approvedCount" as const, label: "Approved", icon: "check_circle", sub: "Ready to contact" },
  { key: "activeProxyCount" as const, label: "Active Proxies", icon: "verified_user", sub: "Active connections" },
];

export default function AnalyticsPanel(initial: AnalyticsPanelProps) {
  const [stats, setStats] = useState(initial);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const prevRef = useRef(initial);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) return;
        const data = await res.json();

        // Detect which values changed
        const changedKeys = new Set<string>();
        for (const key of STATS_CONFIG.map(s => s.key)) {
          if (data[key] !== prevRef.current[key]) {
            changedKeys.add(key);
          }
        }

        if (changedKeys.size > 0) {
          setChanged(changedKeys);
          setTimeout(() => setChanged(new Set()), 600);
        }

        prevRef.current = data;
        setStats(data);
      } catch {
        // silent
      }
    }

    pollRef.current = setInterval(fetchStats, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {STATS_CONFIG.map(({ key, label, icon, sub }) => (
        <div key={key} className="bg-sanctuary-surface-lowest p-6 rounded-xl transition-all hover:bg-sanctuary-surface-low">
          <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-1">{label}</p>
          <p
            className={`text-2xl font-serif font-bold text-sanctuary-primary transition-opacity duration-300 ${
              changed.has(key) ? "opacity-0" : "opacity-100"
            }`}
            style={{ transition: "opacity 0.3s ease" }}
          >
            {stats[key]}
          </p>
          <div className="mt-2 flex items-center text-[10px] text-sanctuary-outline">
            <span className="material-symbols-outlined text-xs mr-1">{icon}</span>
            {sub}
          </div>
        </div>
      ))}
    </section>
  );
}
