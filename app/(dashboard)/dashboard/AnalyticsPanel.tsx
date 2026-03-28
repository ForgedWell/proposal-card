interface AnalyticsPanelProps {
  scanCount: number;
  pendingCount: number;
  approvedCount: number;
  activeProxyCount: number;
}

const stats = [
  { key: "scanCount", label: "Card Views" },
  { key: "pendingCount", label: "Pending" },
  { key: "approvedCount", label: "Approved" },
  { key: "activeProxyCount", label: "Active Proxies" },
] as const;

export default function AnalyticsPanel(props: AnalyticsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ key, label }) => (
        <div key={key} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{props[key]}</p>
          <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
