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
  fieldVisibility?: unknown;
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
    { ...DEFAULT_VIS, ...((profile.fieldVisibility as Partial<FieldVisibility>) ?? {}) }
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
    <div id="profile" className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-8">
      <h3 className="font-serif text-xl text-sanctuary-on-surface">Personal Information</h3>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Display Name</label>
              <button type="button" onClick={() => toggleVis("displayName")} className={`text-[10px] ${visibility.displayName ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
                {visibility.displayName ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Your name" className="input-field text-sm" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Location</label>
              <button type="button" onClick={() => toggleVis("location")} className={`text-[10px] ${visibility.location ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
                {visibility.location ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" className="input-field text-sm" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Bio</label>
            <button type="button" onClick={() => toggleVis("bio")} className={`text-[10px] ${visibility.bio ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
              {visibility.bio ? "Public" : "Hidden"}
            </button>
          </div>
          <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Short bio..." rows={4} className="input-field text-sm resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Card URL</label>
            <div className="flex">
              <span className="bg-sanctuary-surface-container px-3 flex items-center text-xs text-sanctuary-outline rounded-l-lg border-r border-sanctuary-outline-variant/10">/c/</span>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="your-name" className="input-field text-sm rounded-l-none flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Photo URL</label>
              <button type="button" onClick={() => toggleVis("photoUrl")} className={`text-[10px] ${visibility.photoUrl ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
                {visibility.photoUrl ? "Public" : "Hidden"}
              </button>
            </div>
            <input name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://..." className="input-field text-sm" />
          </div>
        </div>

        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Links</label>
              <button type="button" onClick={() => toggleVis("links")} className={`text-[10px] ${visibility.links ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
                {visibility.links ? "Public" : "Hidden"}
              </button>
            </div>
            <button type="button" onClick={addLink} className="text-xs text-sanctuary-primary hover:text-sanctuary-primary-dim font-medium">+ Add link</button>
          </div>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={link.label} onChange={e => updateLink(i, "label", e.target.value)} placeholder="Label" className="input-field text-sm w-28" />
                <input value={link.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..." className="input-field text-sm flex-1" />
                <button type="button" onClick={() => removeLink(i)} className="text-sanctuary-outline hover:text-sanctuary-tertiary transition-colors text-lg leading-none">x</button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary py-3 text-sm max-w-[200px]">
            {saving ? "Saving…" : "Save Profile"}
          </button>
          {saved && <span className="text-xs text-sanctuary-primary font-medium">Saved</span>}
        </div>
      </form>
    </div>
  );
}
