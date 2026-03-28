"use client";

import { useState } from "react";

interface Link { label: string; url: string; }
interface FieldVisibility {
  displayName: boolean;
  bio: boolean;
  location: boolean;
  photoUrl: boolean;
  links: boolean;
}
const DEFAULT_VIS: FieldVisibility = { displayName: true, bio: true, location: true, photoUrl: false, links: false };

interface Profile {
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  slug?: string | null;
  photoUrl?: string | null;
  links?: unknown;
  fieldVisibility?: FieldVisibility | null;
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    displayName: profile.displayName ?? "",
    bio:         profile.bio ?? "",
    location:    profile.location ?? "",
    slug:        profile.slug ?? "",
    photoUrl:    profile.photoUrl ?? "",
  });
  const [links, setLinks] = useState<Link[]>(
    Array.isArray(profile.links) ? (profile.links as Link[]) : []
  );
  const [visibility, setVisibility] = useState<FieldVisibility>(
    { ...DEFAULT_VIS, ...(profile.fieldVisibility ?? {}) }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function toggleVis(field: keyof FieldVisibility) {
    setVisibility(v => ({ ...v, [field]: !v[field] }));
    setSaved(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function addLink() {
    setLinks(l => [...l, { label: "", url: "" }]);
  }

  function updateLink(i: number, field: "label" | "url", val: string) {
    setLinks(l => l.map((lk, idx) => idx === i ? { ...lk, [field]: val } : lk));
  }

  function removeLink(i: number) {
    setLinks(l => l.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, links: links.filter(l => l.label && l.url), fieldVisibility: visibility }),
      });
      const data = await res.json();
      if (!res.ok) {
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
      <h2 className="font-semibold text-slate-900 mb-5">Edit Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-600">Display name</label>
              <button type="button" onClick={() => toggleVis("displayName")} className={`text-xs ${visibility.displayName ? "text-green-600" : "text-slate-400"}`}>
                {visibility.displayName ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Your name" className="input-field text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-600">Location</label>
              <button type="button" onClick={() => toggleVis("location")} className={`text-xs ${visibility.location ? "text-green-600" : "text-slate-400"}`}>
                {visibility.location ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" className="input-field text-sm" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-600">Bio</label>
            <button type="button" onClick={() => toggleVis("bio")} className={`text-xs ${visibility.bio ? "text-green-600" : "text-slate-400"}`}>
              {visibility.bio ? "Public" : "Hidden"}
            </button>
          </div>
          <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Short bio..." rows={3} className="input-field text-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Card URL slug</label>
            <div className="flex items-center">
              <span className="text-xs text-slate-400 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg px-2 py-2.5">/c/</span>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="your-name" className="input-field text-sm rounded-l-none flex-1" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-600">Photo URL</label>
              <button type="button" onClick={() => toggleVis("photoUrl")} className={`text-xs ${visibility.photoUrl ? "text-green-600" : "text-slate-400"}`}>
                {visibility.photoUrl ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://..." className="input-field text-sm" />
          </div>
        </div>

        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Links</label>
              <button type="button" onClick={() => toggleVis("links")} className={`text-xs ${visibility.links ? "text-green-600" : "text-slate-400"}`}>
                {visibility.links ? "Public" : "Hidden"}
              </button>
            </div>
            <button type="button" onClick={addLink} className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add link</button>
          </div>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={link.label} onChange={e => updateLink(i, "label", e.target.value)} placeholder="Label" className="input-field text-sm w-28" />
                <input value={link.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..." className="input-field text-sm flex-1" />
                <button type="button" onClick={() => removeLink(i)} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">x</button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary py-2 text-sm">
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  );
}
