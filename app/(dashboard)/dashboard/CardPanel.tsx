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
    <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-sanctuary-on-surface">Card Status</h3>
        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${
          active ? "bg-sanctuary-primary text-sanctuary-on-primary" : "bg-sanctuary-surface-high text-sanctuary-outline"
        }`}>
          {active ? "Live" : "Inactive"}
        </span>
      </div>

      {active && cardUrl && (
        <div className="space-y-4">
          <div className="bg-sanctuary-surface-low rounded-lg p-4 flex items-center justify-between gap-3">
            <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-sanctuary-primary hover:underline font-medium truncate">
              {cardUrl}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(cardUrl)}
              className="text-xs text-sanctuary-outline hover:text-sanctuary-on-surface shrink-0"
            >
              Copy
            </button>
          </div>

          {qrSvg && (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-40 h-40 rounded-xl overflow-hidden border border-sanctuary-surface-high"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="text-xs text-sanctuary-outline">Scan to view your card</p>
            </div>
          )}
        </div>
      )}

      {!active && (
        <p className="text-sm text-sanctuary-on-surface-variant">
          Activate your card to get a shareable URL and QR code.
        </p>
      )}

      {error && <p className="text-xs text-sanctuary-error">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={toggleCard}
          disabled={loading}
          className={`text-sm font-medium px-6 py-3 rounded-xl transition-colors ${
            active
              ? "bg-sanctuary-tertiary/10 text-sanctuary-tertiary hover:bg-sanctuary-tertiary/20"
              : "btn-primary max-w-[200px]"
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
            className="text-sm font-medium px-6 py-3 rounded-xl bg-sanctuary-surface-low text-sanctuary-on-surface hover:bg-sanctuary-surface-container transition-colors"
          >
            {downloading ? "…" : "Download PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
