"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Country, City } from "country-state-city";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<"brother" | "sister" | "">("");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(() => {
    const c = countries.find(c => c.name === country);
    return c ? City.getCitiesOfCountry(c.isoCode) ?? [] : [];
  }, [country, countries]);

  const isValid = name.trim() && month && day && year && gender && country;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setSaving(true);

    const dateOfBirth = `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), dateOfBirth, gender, country, city: city || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-sanctuary-surface flex flex-col selection:bg-sanctuary-primary-container">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#466564 0.5px, transparent 0.5px), radial-gradient(#466564 0.5px, #fafaf5 0.5px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />

      <header className="w-full px-6 py-8 max-w-7xl mx-auto z-10">
        <div className="text-xl font-serif italic font-bold text-sanctuary-primary tracking-tight">
          Proposal Card
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-[480px]">
          <section className="bg-sanctuary-surface-lowest rounded-xl p-10 md:p-12 shadow-[0px_12px_32px_rgba(47,52,46,0.04)]">
            <div className="mb-8 text-center">
              <h1 className="font-serif italic text-3xl text-sanctuary-on-surface mb-3">
                Let&apos;s set up your profile
              </h1>
              <p className="text-sm text-sanctuary-on-surface-variant leading-relaxed">
                This takes less than a minute. You can update everything later from your profile.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  className="input-field text-sm"
                  required
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Date of birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={month} onChange={e => setMonth(e.target.value)} className="input-field text-sm" required>
                    <option value="">Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={day} onChange={e => setDay(e.target.value)} className="input-field text-sm" required>
                    <option value="">Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={year} onChange={e => setYear(e.target.value)} className="input-field text-sm" required>
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Gender toggle */}
              <div className="space-y-2">
                <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("brother")}
                    className={`py-3.5 rounded-xl font-medium text-sm transition-all ${
                      gender === "brother"
                        ? "bg-sanctuary-primary text-sanctuary-on-primary shadow-sm"
                        : "bg-sanctuary-surface-low text-sanctuary-outline border border-sanctuary-outline-variant/15 hover:bg-sanctuary-surface-container"
                    }`}
                  >
                    Brother
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("sister")}
                    className={`py-3.5 rounded-xl font-medium text-sm transition-all ${
                      gender === "sister"
                        ? "bg-sanctuary-primary text-sanctuary-on-primary shadow-sm"
                        : "bg-sanctuary-surface-low text-sanctuary-outline border border-sanctuary-outline-variant/15 hover:bg-sanctuary-surface-container"
                    }`}
                  >
                    Sister
                  </button>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Location</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={country}
                    onChange={e => { setCountry(e.target.value); setCity(""); }}
                    className="input-field text-sm"
                    required
                  >
                    <option value="">Country</option>
                    {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                  </select>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">City (optional)</option>
                    {cities.slice(0, 500).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={!isValid || saving}
                className="w-full py-4 font-medium text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#2D5A52" }}
              >
                <span>{saving ? "Setting up…" : "Continue to dashboard"}</span>
                {!saving && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
