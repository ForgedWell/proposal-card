"use client";

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
}

const PLACEHOLDER_ITEMS: ActivityItem[] = [
  { id: "1", icon: "visibility",    text: "Someone viewed your card",           time: "2 hours ago" },
  { id: "2", icon: "person_add",    text: "New connection request received",    time: "5 hours ago" },
  { id: "3", icon: "shield_person", text: "Guardian notified of new request",   time: "1 day ago" },
];

export default function RecentActivityWidget({ items }: { items?: ActivityItem[] }) {
  const activity = items ?? PLACEHOLDER_ITEMS;

  return (
    <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
      <h3 className="font-serif text-xl text-sanctuary-on-surface">Recent Activity</h3>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-sanctuary-outline-variant text-4xl mb-3">credit_card</span>
          <p className="text-sm text-sanctuary-on-surface-variant">
            No activity yet — activate your card to start sharing
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          {activity.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3 border-b border-sanctuary-surface-low last:border-0">
              <div className="w-8 h-8 rounded-lg bg-sanctuary-surface-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sanctuary-primary text-[18px]">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sanctuary-on-surface truncate">{item.text}</p>
                <p className="text-[11px] text-sanctuary-outline">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
