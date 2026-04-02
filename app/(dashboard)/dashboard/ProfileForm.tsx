"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationSelector from "@/components/LocationSelector";
import { validateIntention } from "@/lib/safety/profanity";

// ─── Option constants ────────────────────────────────────────────────────────

const HEIGHT_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const totalInches = 56 + i; // 4'8" to 6'10"
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
});

const EDUCATION_OPTIONS = [
  "High School", "Some College", "Bachelor's", "Master's",
  "PhD", "Trade/Vocational", "Prefer not to say",
];

const PROFESSION_OPTIONS = [
  "Healthcare", "Education", "Engineering", "Business & Finance",
  "Law", "Tech", "Trades", "Creative Arts", "Government",
  "Student", "Other", "Prefer not to say",
];

const RELIGIOSITY_OPTIONS = [
  "Actively Practicing", "Moderately Practicing",
  "Learning/Growing", "Prefer not to say",
];

const MARITAL_OPTIONS = [
  "Never Married", "Divorced", "Widowed", "Prefer not to say",
];

const CHILDREN_OPTIONS = ["No", "Yes", "Prefer not to say"];
const WANTS_CHILDREN_OPTIONS = ["Yes", "Open to it", "No", "Prefer not to say"];

const LANGUAGE_OPTIONS = [
  "Arabic", "English", "Urdu", "French", "Somali",
  "Turkish", "Malay", "Bengali", "Persian", "Swahili", "Other",
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  displayName?: string | null;
  slug?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  height?: string | null;
  education?: string | null;
  profession?: string | null;
  religiosity?: string | null;
  maritalHistory?: string | null;
  hasChildren?: string | null;
  wantsChildren?: string | null;
  languages?: unknown;
  intention?: string | null;
  fieldVisibility?: unknown;
  [key: string]: unknown;
}

interface FieldVisibility {
  displayName: boolean;
  bio: boolean;
  location: boolean;
  photoUrl: boolean;
  links: boolean;
}
const DEFAULT_VIS: FieldVisibility = { displayName: true, bio: true, location: true, photoUrl: false, links: false };

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [height, setHeight] = useState(profile.height ?? "");
  const [education, setEducation] = useState(profile.education ?? "");
  const [profession, setProfession] = useState(profile.profession ?? "");
  const [religiosity, setReligiosity] = useState(profile.religiosity ?? "");
  const [maritalHistory, setMaritalHistory] = useState(profile.maritalHistory ?? "");
  const [hasChildren, setHasChildren] = useState(profile.hasChildren ?? "");
  const [wantsChildren, setWantsChildren] = useState(profile.wantsChildren ?? "");
  const [languages, setLanguages] = useState<string[]>(
    Array.isArray(profile.languages) ? (profile.languages as string[]) : []
  );
  const [intention, setIntention] = useState(profile.intention ?? "");
  const [visibility, setVisibility] = useState<FieldVisibility>(
    { ...DEFAULT_VIS, ...((profile.fieldVisibility as Partial<FieldVisibility>) ?? {}) }
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleVis(field: keyof FieldVisibility) {
    setVisibility(v => ({ ...v, [field]: !v[field] }));
    setSaved(false);
  }

  function toggleLanguage(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!displayName.trim()) {
      setError("Please complete all required fields before saving");
      return;
    }

    // Intention dignity check (client-side — also enforced server-side)
    if (intention) {
      const check = validateIntention(intention);
      if (!check.valid) {
        setError(check.error!);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          country: country || undefined,
          state: state || undefined,
          city: city || undefined,
          height: height || undefined,
          education: education || undefined,
          profession: profession || undefined,
          religiosity: religiosity || undefined,
          maritalHistory: maritalHistory || undefined,
          hasChildren: hasChildren || undefined,
          wantsChildren: wantsChildren || undefined,
          languages: languages.length > 0 ? languages : undefined,
          intention: intention || undefined,
          fieldVisibility: visibility,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";

  const calculatedAge = profile.dateOfBirth ? (() => {
    const dob = new Date(profile.dateOfBirth as string);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  })() : null;

  return (
    <div id="profile" className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-8">
      <h3 className="font-serif text-xl text-sanctuary-on-surface">Personal Information</h3>

      {/* Read-only identity fields */}
      <IdentityBadge gender={profile.gender as string | null} age={calculatedAge} />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Display Name */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Display Name *</label>
            <button type="button" onClick={() => toggleVis("displayName")} className={`text-[10px] ${visibility.displayName ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
              {visibility.displayName ? "Public" : "Hidden"}
            </button>
          </div>
          <input
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
            placeholder="Your name"
            className="input-field text-sm"
            required
          />
        </div>

        {/* Card URL (read-only) */}
        {profile.slug && (
          <div className="space-y-1">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Your Card URL</label>
            <div className="flex items-center gap-2 bg-sanctuary-surface-low rounded-lg px-4 py-3">
              <span className="text-sm text-sanctuary-on-surface-variant">{appUrl}/c/</span>
              <span className="text-sm font-semibold text-sanctuary-on-surface">{profile.slug}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${appUrl}/c/${profile.slug}`)}
                className="ml-auto text-sanctuary-outline hover:text-sanctuary-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Location</label>
            <button type="button" onClick={() => toggleVis("location")} className={`text-[10px] ${visibility.location ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
              {visibility.location ? "Public" : "Hidden"}
            </button>
          </div>
          <LocationSelector
            defaultCountry={country}
            defaultState={state}
            onChange={(c, s) => { setCountry(c); setState(s); setSaved(false); }}
          />
        </div>

        {/* Structured bio fields — 2-column grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">About You</label>
            <button type="button" onClick={() => toggleVis("bio")} className={`text-[10px] ${visibility.bio ? "text-sanctuary-primary" : "text-sanctuary-outline"}`}>
              {visibility.bio ? "Public" : "Hidden"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Height" value={height} onChange={v => { setHeight(v); setSaved(false); }} options={HEIGHT_OPTIONS} />
            <SelectField label="Education" value={education} onChange={v => { setEducation(v); setSaved(false); }} options={EDUCATION_OPTIONS} />
            <SelectField label="Profession" value={profession} onChange={v => { setProfession(v); setSaved(false); }} options={PROFESSION_OPTIONS} />
            <SelectField label="Religiosity" value={religiosity} onChange={v => { setReligiosity(v); setSaved(false); }} options={RELIGIOSITY_OPTIONS} />
            <SelectField label="Marital History" value={maritalHistory} onChange={v => { setMaritalHistory(v); setSaved(false); }} options={MARITAL_OPTIONS} />
            <SelectField label="Has Children" value={hasChildren} onChange={v => { setHasChildren(v); setSaved(false); }} options={CHILDREN_OPTIONS} />
            <SelectField label="Wants Children" value={wantsChildren} onChange={v => { setWantsChildren(v); setSaved(false); }} options={WANTS_CHILDREN_OPTIONS} />
          </div>
        </div>

        {/* Languages multi-select */}
        <div className="space-y-2">
          <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  languages.includes(lang)
                    ? "border-sanctuary-primary bg-sanctuary-primary/10 text-sanctuary-primary"
                    : "border-sanctuary-surface-high text-sanctuary-outline hover:bg-sanctuary-surface-low"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Intention statement */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Brief Intention (optional)</label>
            <span className={`text-[10px] ${intention.length > 130 ? "text-sanctuary-tertiary" : "text-sanctuary-outline"}`}>
              {intention.length}/140
            </span>
          </div>
          <textarea
            value={intention}
            onChange={e => { if (e.target.value.length <= 140) { setIntention(e.target.value); setSaved(false); } }}
            placeholder="e.g. Seeking a partner who values faith, family, and growth."
            rows={2}
            className="input-field text-sm resize-none"
          />
        </div>

        {/* Photo sharing info */}
        <div className="bg-sanctuary-surface-low rounded-xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-sanctuary-primary text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
          <div>
            <p className="text-sm font-medium text-sanctuary-on-surface mb-1">Photo sharing</p>
            <p className="text-[12px] leading-relaxed text-sanctuary-on-surface-variant">
              Your photo is never shown on your public card. After a Guardian-approved connection is made, you may choose to share your photo privately and directly with that contact.
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {error && <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary py-3 text-sm max-w-[200px]">
            {saving ? "Saving…" : "Save Profile"}
          </button>
          {saved && (
            <span className="text-xs text-sanctuary-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Profile updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Reusable select field ───────────────────────────────────────────────────

function IdentityBadge({ gender, age }: { gender: string | null; age: number | null }) {
  if (!gender && age === null) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {gender && (
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sanctuary-primary text-sanctuary-on-primary">
          {gender === "sister" ? "Sister" : "Brother"}
        </span>
      )}
      {age !== null && (
        <span className="text-sm text-sanctuary-on-surface-variant">{age} years old</span>
      )}
      <span className="text-[10px] text-sanctuary-outline">To update gender or date of birth, contact support.</span>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-sm"
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
