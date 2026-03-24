"use client";

import { useState } from "react";

interface Request {
  id: string;
  prospectName: string | null;
  prospectContact: string | null;
  intent: string | null;
  createdAt: Date | string;
  status: string;
}

export default function RequestsPanel({ requests: initial }: { requests: Request[] }) {
  const [requests, setRequests] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(requestId: string, action: "approve" | "decline") {
    setLoading(requestId);
    try {
      const res = await fetch("/api/connect/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setRequests(r => r.filter(req => req.id !== requestId));
      }
    } finally {
      setLoading(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-1">
        Pending Requests
        <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        These people want to connect with you via your card.
      </p>

      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{req.prospectName ?? "Unknown"}</p>
                <p className="text-xs text-slate-400 mt-0.5">{req.prospectContact}</p>
                {req.intent && (
                  <p className="text-sm text-slate-600 mt-2 leading-snug">{req.intent}</p>
                )}
                <p className="text-xs text-slate-300 mt-2">
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => decide(req.id, "decline")}
                  disabled={loading === req.id}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => decide(req.id, "approve")}
                  disabled={loading === req.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  {loading === req.id ? "…" : "Approve"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
