"use client";

import { useState, useEffect, useRef } from "react";

export default function SafetyPanel() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function handlePanic() {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 5000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/safety/panic", { method: "POST" });
      if (res.ok) {
        setActivated(true);
        setConfirming(false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="safety" className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-sanctuary-surface-low p-2 rounded-lg text-sanctuary-on-surface">
          <span className="material-symbols-outlined">security</span>
        </div>
        <h3 className="font-serif text-xl text-sanctuary-on-surface">Integrity & Safety</h3>
      </div>

      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <span className="material-symbols-outlined text-sanctuary-primary text-sm mt-0.5">check_circle</span>
          <p className="text-sm text-sanctuary-on-surface-variant">Never share personal home addresses until identity is verified via Wali.</p>
        </li>
        <li className="flex items-start gap-3">
          <span className="material-symbols-outlined text-sanctuary-primary text-sm mt-0.5">check_circle</span>
          <p className="text-sm text-sanctuary-on-surface-variant">Use the in-app messaging system to maintain a professional log of all chats.</p>
        </li>
        <li className="flex items-start gap-3">
          <span className="material-symbols-outlined text-sanctuary-primary text-sm mt-0.5">check_circle</span>
          <p className="text-sm text-sanctuary-on-surface-variant">Report any behavior that lacks the dignity of the community standards.</p>
        </li>
      </ul>

      <div className="pt-6 border-t border-sanctuary-surface-low">
        <p className="text-xs text-sanctuary-outline mb-4 italic">In case of harassment or unauthorized access, use the emergency action below.</p>

        {activated ? (
          <p className="text-xs font-medium text-sanctuary-primary bg-sanctuary-primary-container rounded-xl px-4 py-3">
            Safety lockdown activated. Your card is now hidden and all connections are closed.
          </p>
        ) : (
          <button
            onClick={handlePanic}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(158,65,66,0.2)] ${
              confirming
                ? "bg-sanctuary-tertiary-dim text-sanctuary-on-tertiary"
                : "bg-sanctuary-tertiary text-sanctuary-on-tertiary hover:bg-sanctuary-error"
            }`}
          >
            <span className="material-symbols-outlined">emergency_home</span>
            {loading ? "Activating…" : confirming ? "Are you sure? Click again to confirm" : "Activate Safety Lockdown"}
          </button>
        )}
      </div>
    </div>
  );
}
