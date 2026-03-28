"use client";

import { useState } from "react";
import { CARD_TEMPLATES, COLOR_PRESETS, DEFAULT_CARD_COLOR } from "@/lib/card/templates";
import type { CardTemplateName } from "@/lib/card/templates";
import CardRenderer from "@/components/CardRenderer";

interface Profile {
  cardTemplate?: string;
  cardColor?: string | null;
  displayName?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  location?: string | null;
  links?: unknown;
  fieldVisibility?: unknown;
}

const TEMPLATE_DESCRIPTIONS: Record<CardTemplateName, string> = {
  CLASSIC: "Gradient header with centered photo",
  MINIMAL: "Clean whitespace, inline layout",
  ELEGANT: "Dark background, serif typography",
};

export default function CardDesignerPanel({ profile }: { profile: Profile }) {
  const [template, setTemplate] = useState<CardTemplateName>(
    (profile.cardTemplate as CardTemplateName) ?? "CLASSIC"
  );
  const [color, setColor] = useState(profile.cardColor ?? DEFAULT_CARD_COLOR);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const links = Array.isArray(profile.links)
    ? (profile.links as { label: string; url: string }[])
    : [];

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardTemplate: template, cardColor: color }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-5">Card Design</h2>

      {/* Template selector */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-600 mb-2">Template</label>
        <div className="grid grid-cols-3 gap-2">
          {CARD_TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTemplate(t); setSaved(false); }}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                template === t
                  ? "border-brand-600 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-medium text-slate-800">
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{TEMPLATE_DESCRIPTIONS[t]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-600 mb-2">Accent Color</label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => { setColor(c.hex); setSaved(false); }}
              title={c.name}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c.hex ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-600 mb-2">Preview</label>
        <div className="bg-slate-50 rounded-xl p-4 flex justify-center overflow-hidden">
          <div className="w-full max-w-[260px]" style={{ transform: "scale(0.75)", transformOrigin: "top center" }}>
            <CardRenderer
              template={template}
              color={color}
              displayName={profile.displayName ?? "Your Name"}
              bio={profile.bio ?? "Your bio will appear here"}
              photoUrl={profile.photoUrl ?? null}
              location={profile.location ?? null}
              links={links.slice(0, 2)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary py-2 text-sm">
          {saving ? "Saving…" : "Save design"}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
      </div>
    </div>
  );
}
