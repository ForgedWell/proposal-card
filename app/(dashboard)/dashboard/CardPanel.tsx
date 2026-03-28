"use client";

import { useState, useEffect } from "react";

interface Profile {
  cardActive: boolean;
  slug?: string | null;
  cardToken?: string | null;
}

export default function CardPanel({ profile }: { profile: Profile }) {
  const [active, setActive]   = useState(profile.cardActive);
  const [slug, setSlug]       = useState(profile.slug ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [qrSvg, setQrSvg]    = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const cardUrl = slug ? `${appUrl}/c/${slug}` : null;

  useEffect(() => {
    if (!active || !slug) { setQrSvg(null); return; }
    fetch("/api/profile/qr")
      .then((res) => (res.ok ? res.text() : null))
      .then((svg) => setQrSvg(svg))
      .catch(() => setQrSvg(null));
  }, [active, slug]);

  async function toggleCard() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/card", {
        method: active ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setActive(!active);
      if (data.slug) setSlug(data.slug);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Your Card</h2>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {active ? "Live" : "Inactive"}
        </span>
      </div>

      {active && cardUrl && (
        <div className="mb-4 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-3">
            <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline font-medium truncate">
              {cardUrl}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(cardUrl)}
              className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
            >
              Copy
            </button>
          </div>

          {qrSvg && (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-48 h-48 rounded-xl overflow-hidden border border-slate-100"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="text-xs text-slate-400">Scan to view your card</p>
            </div>
          )}
        </div>
      )}

      {!active && (
        <p className="text-sm text-slate-500 mb-4">
          Activate your card to get a shareable URL and QR code.
        </p>
      )}

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={toggleCard}
          disabled={loading}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
            active
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "btn-primary"
          }`}
        >
          {loading ? "…" : active ? "Deactivate card" : "Activate card"}
        </button>

        {active && (
          <button
            onClick={async () => {
              setDownloading(true);
              try {
                const res = await fetch("/api/profile/card-pdf");
                if (!res.ok) { setError("Failed to generate PDF"); return; }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "proposal-card.pdf";
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                setError("Download failed");
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {downloading ? "…" : "Download PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
