interface AnalyticsPanelProps {
  scanCount: number;
  pendingCount: number;
  approvedCount: number;
  activeProxyCount: number;
}

export default function AnalyticsPanel(props: AnalyticsPanelProps) {
  const stats = [
    { key: "scanCount" as const, label: "Card Views", icon: "visibility" },
    { key: "pendingCount" as const, label: "Pending", icon: "hourglass_top" },
    { key: "approvedCount" as const, label: "Approved", icon: "check_circle" },
    { key: "activeProxyCount" as const, label: "Active Proxies", icon: "verified_user" },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map(({ key, label, icon }) => (
        <div key={key} className="bg-sanctuary-surface-lowest p-6 rounded-xl transition-all hover:bg-sanctuary-surface-low">
          <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-1">{label}</p>
          <p className="text-2xl font-serif font-bold text-sanctuary-primary">{props[key]}</p>
          <div className="mt-2 flex items-center text-[10px] text-sanctuary-outline">
            <span className="material-symbols-outlined text-xs mr-1">{icon}</span>
            {key === "scanCount" ? "Total views" : key === "pendingCount" ? "Awaiting review" : key === "approvedCount" ? "Ready to contact" : "Active connections"}
          </div>
        </div>
      ))}
    </section>
  );
}
