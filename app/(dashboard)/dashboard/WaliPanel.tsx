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
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Guardian (Wali) Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Your Wali will be notified whenever someone sends a contact request via your card.
          They do not control approvals — only you do.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Guardian email</label>
            <input
              name="waliEmail"
              value={form.waliEmail}
              onChange={handleChange}
              type="email"
              placeholder="guardian@example.com"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Guardian phone</label>
            <input
              name="waliPhone"
              value={form.waliPhone}
              onChange={handleChange}
              type="tel"
              placeholder="+1 555 000 0000"
              className="input-field text-sm"
            />
          </div>
        </div>

        {form.waliPhone && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              By providing a phone number, you consent to Proposal Card sending SMS messages to this number regarding connection requests and account notifications. Message frequency varies. Message and data rates may apply. Reply STOP to opt out. Reply HELP for help. View our{" "}
              <a href="/terms" className="underline hover:text-slate-600">Terms of Service</a> and{" "}
              <a href="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-600">I agree to receive SMS messages from Proposal Card</span>
            </label>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              name="waliActive"
              checked={form.waliActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-200 peer-checked:bg-brand-600 rounded-full transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-slate-700">
            Enable Wali notifications
            <span className={`ml-2 text-xs font-medium ${form.waliActive ? "text-green-600" : "text-slate-400"}`}>
              {form.waliActive ? "On" : "Off"}
            </span>
          </span>
        </label>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || (!!form.waliPhone && !smsConsent)} className="btn-primary py-2 text-sm">
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  );
}
