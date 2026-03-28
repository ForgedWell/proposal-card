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
    <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-sanctuary-on-surface">Pending Requests</h3>
        <span className="px-3 py-1 bg-sanctuary-tertiary/10 text-sanctuary-tertiary text-[10px] font-bold rounded-full uppercase tracking-widest">
          {requests.length}
        </span>
      </div>
      <p className="text-sm text-sanctuary-on-surface-variant">
        These people want to connect with you via your card.
      </p>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="border border-sanctuary-surface-high rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sanctuary-on-surface text-sm">{req.prospectName ?? "Unknown"}</p>
                <p className="text-xs text-sanctuary-outline mt-0.5">{req.prospectContact}</p>
                {req.intent && (
                  <p className="text-sm text-sanctuary-on-surface-variant mt-2 leading-snug italic font-serif">{req.intent}</p>
                )}
                <p className="text-xs text-sanctuary-outline-variant mt-2">
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => decide(req.id, "decline")}
                  disabled={loading === req.id}
                  className="text-xs px-4 py-2 rounded-lg bg-sanctuary-surface-low text-sanctuary-outline hover:bg-sanctuary-surface-container transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => decide(req.id, "approve")}
                  disabled={loading === req.id}
                  className="text-xs px-4 py-2 rounded-lg bg-sanctuary-primary text-sanctuary-on-primary hover:bg-sanctuary-primary-dim transition-colors"
                >
                  {loading === req.id ? "…" : "Approve"}
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-sanctuary-surface-low flex items-center gap-3">
              <button
                onClick={() => blockContact(req)}
                disabled={loading === req.id || !req.prospectContact}
                className="text-xs text-sanctuary-tertiary hover:text-sanctuary-tertiary-dim transition-colors"
              >
                Block
              </button>
              <button
                onClick={() => setReporting(reporting === req.id ? null : req.id)}
                className="text-xs text-sanctuary-outline hover:text-sanctuary-on-surface transition-colors"
              >
                Report
              </button>
            </div>

            {reporting === req.id && (
              <div className="mt-3 p-4 bg-sanctuary-surface-low rounded-lg space-y-3">
                <p className="text-xs font-medium text-sanctuary-on-surface">Report category</p>
                <div className="flex flex-wrap gap-2">
                  {(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"] as ReportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReportCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        reportCategory === cat
                          ? "border-sanctuary-tertiary bg-sanctuary-tertiary/10 text-sanctuary-tertiary"
                          : "border-sanctuary-surface-high text-sanctuary-outline hover:bg-sanctuary-surface-container"
                      }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => submitReport(req)}
                  disabled={loading === req.id}
                  className="text-xs px-4 py-2 rounded-lg bg-sanctuary-tertiary text-sanctuary-on-tertiary hover:bg-sanctuary-tertiary-dim transition-colors"
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
