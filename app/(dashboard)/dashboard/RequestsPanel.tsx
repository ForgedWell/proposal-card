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

type ReportCategory = "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "OTHER";

export default function RequestsPanel({ requests: initial }: { requests: Request[] }) {
  const [requests, setRequests] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportCategory, setReportCategory] = useState<ReportCategory>("SPAM");

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

  async function blockContact(req: Request) {
    if (!req.prospectContact) return;
    setLoading(req.id);
    try {
      const res = await fetch("/api/safety/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: req.prospectContact }),
      });
      if (res.ok) {
        setRequests(r => r.filter(r => r.id !== req.id));
      }
    } finally {
      setLoading(null);
    }
  }

  async function submitReport(req: Request) {
    setLoading(req.id);
    try {
      await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionRequestId: req.id,
          contact: req.prospectContact,
          category: reportCategory,
        }),
      });
      // Also block after reporting
      if (req.prospectContact) {
        await fetch("/api/safety/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: req.prospectContact }),
        });
      }
      setRequests(r => r.filter(r => r.id !== req.id));
      setReporting(null);
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

            {/* Block & Report row */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
              <button
                onClick={() => blockContact(req)}
                disabled={loading === req.id || !req.prospectContact}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Block
              </button>
              <button
                onClick={() => setReporting(reporting === req.id ? null : req.id)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Report
              </button>
            </div>

            {/* Report inline form */}
            {reporting === req.id && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-slate-600">Report category</p>
                <div className="flex flex-wrap gap-2">
                  {(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"] as ReportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReportCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        reportCategory === cat
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => submitReport(req)}
                  disabled={loading === req.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {loading === req.id ? "…" : "Submit Report & Block"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
