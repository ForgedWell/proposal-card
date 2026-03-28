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
    <div id="card-designer" className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-8">
      <div className="flex justify-between items-end">
        <h3 className="font-serif text-xl text-sanctuary-on-surface">Card Preview</h3>
        <span className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Live Draft</span>
      </div>

      {/* Live preview */}
      <div className="relative">
        <div className="w-full max-w-md mx-auto">
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

      {/* Customization */}
      <div className="space-y-6 pt-6 border-t border-sanctuary-surface-low">
        <div>
          <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-4">Template Selection</p>
          <div className="flex gap-4">
            {CARD_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTemplate(t); setSaved(false); }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  template === t
                    ? "border border-sanctuary-primary text-sanctuary-primary"
                    : "bg-sanctuary-surface-low text-sanctuary-outline hover:bg-sanctuary-surface-container"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-4">Accent Swatches</p>
          <div className="flex gap-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => { setColor(c.hex); setSaved(false); }}
                title={c.name}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c.hex ? "ring-2 ring-offset-2 ring-sanctuary-primary scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary py-3 text-sm max-w-[200px]">
          {saving ? "Saving…" : "Save Design"}
        </button>
        {saved && <span className="text-xs text-sanctuary-primary font-medium">Saved</span>}
      </div>
    </div>
  );
}
