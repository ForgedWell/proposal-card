"use client";

import { useState } from "react";

interface WaliSettings {
  waliEmail?: string | null;
  waliPhone?: string | null;
  waliActive: boolean;
}

export default function WaliPanel({ settings }: { settings: WaliSettings }) {
  const [form, setForm] = useState({
    waliEmail:  settings.waliEmail  ?? "",
    waliPhone:  settings.waliPhone  ?? "",
    waliActive: settings.waliActive,
  });
  const [smsConsent, setSmsConsent] = useState(!!settings.waliPhone);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/wali", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      setSaved(true);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="guardian" className="bg-sanctuary-secondary-container/30 border border-sanctuary-secondary-container/20 rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-sanctuary-secondary-container p-2 rounded-lg text-sanctuary-on-secondary-container">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <h3 className="font-serif text-xl text-sanctuary-on-surface">Guardian (Wali) Settings</h3>
        </div>
        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${
          form.waliActive ? "bg-sanctuary-primary text-sanctuary-on-primary" : "bg-sanctuary-surface-high text-sanctuary-outline"
        }`}>
          {form.waliActive ? "Active" : "Off"}
        </span>
      </div>

      <p className="text-sm text-sanctuary-on-surface-variant leading-relaxed">
        Your Wali will be notified whenever someone sends a contact request via your card. They do not control approvals — only you do.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Guardian Email</label>
          <input
            name="waliEmail"
            value={form.waliEmail}
            onChange={handleChange}
            type="email"
            placeholder="guardian@example.com"
            className="w-full bg-sanctuary-surface-lowest border-0 rounded-lg px-4 py-3 text-sanctuary-on-surface placeholder-sanctuary-outline focus:outline-none focus:ring-2 focus:ring-sanctuary-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Mobile Number</label>
          <input
            name="waliPhone"
            value={form.waliPhone}
            onChange={handleChange}
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full bg-sanctuary-surface-lowest border-0 rounded-lg px-4 py-3 text-sanctuary-on-surface placeholder-sanctuary-outline focus:outline-none focus:ring-2 focus:ring-sanctuary-primary"
          />
        </div>

        {form.waliPhone && (
          <div className="space-y-2">
            <p className="text-xs text-sanctuary-on-surface-variant leading-relaxed">
              By providing a phone number, you consent to Proposal Card sending SMS messages to this number regarding connection requests and account notifications. Message frequency varies. Message and data rates may apply. Reply STOP to opt out. Reply HELP for help. View our{" "}
              <a href="/terms" className="underline hover:text-sanctuary-primary">Terms of Service</a> and{" "}
              <a href="/privacy-policy" className="underline hover:text-sanctuary-primary">Privacy Policy</a>.
            </p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="w-4 h-4 rounded border-sanctuary-outline text-sanctuary-primary focus:ring-sanctuary-primary"
              />
              <span className="text-xs text-sanctuary-on-surface-variant">I agree to receive SMS messages from Proposal Card</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-sanctuary-on-surface">Enable Wali Notifications</span>
          <label className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer">
            <input
              type="checkbox"
              name="waliActive"
              checked={form.waliActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-sanctuary-surface-high peer-checked:bg-sanctuary-primary rounded-full transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {error && <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || (!!form.waliPhone && !smsConsent)} className="w-full py-3 bg-sanctuary-on-secondary-container text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? "Saving…" : "Update Guardian Access"}
          </button>
          {saved && <span className="text-xs text-sanctuary-primary font-medium">Saved</span>}
        </div>
      </form>
    </div>
  );
}
