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
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Safety</h2>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4 mb-5">
        <p className="text-xs font-medium text-blue-800 mb-2">Safety Tips</p>
        <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
          <li>Only share your card with people you feel comfortable connecting with</li>
          <li>Review each contact request before approving — check their intent</li>
          <li>Use the Wali (guardian) feature to have a trusted person notified of requests</li>
          <li>Block or report any contacts that make you uncomfortable</li>
        </ul>
      </div>

      {/* Panic button */}
      <div className="bg-red-50 rounded-xl p-4">
        <p className="text-xs font-medium text-red-800 mb-1">Emergency: Hide Profile</p>
        <p className="text-xs text-red-600 mb-3">
          This will immediately deactivate your card, close all active proxy connections, and send you a confirmation email.
        </p>

        {activated ? (
          <p className="text-xs font-medium text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Safety lockdown activated. Your card is now hidden and all connections are closed.
          </p>
        ) : (
          <button
            onClick={handlePanic}
            disabled={loading}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
              confirming
                ? "bg-red-700 text-white hover:bg-red-800"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {loading ? "Activating…" : confirming ? "Are you sure? Click again to confirm" : "Activate Safety Lockdown"}
          </button>
        )}
      </div>
    </div>
  );
}
