"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const SCREENS = [
  {
    headline: "A new way to make introductions.",
    body: "Proposal Card brings the seriousness of traditional introductions into the modern world. Share a card. Not a profile on an app. A real introduction, with real intent.",
    features: null,
    note: null,
    button: "Next",
  },
  {
    headline: "Simple by design.",
    body: "Your card carries only what matters — who you are, where you're from, and your intention. A Guardian (Wali) watches over every connection. Nothing moves forward without your approval.",
    features: [
      { icon: "shield_person", label: "Guardian oversight on every connection" },
      { icon: "credit_card", label: "Your information, always in your control" },
      { icon: "lock", label: "No matches, no algorithms, no noise" },
    ],
    note: null,
    button: "Next",
  },
  {
    headline: "You're in good company.",
    body: "Whether you're beginning this journey yourself or guiding someone you love — welcome. Take your time. This is meant to be meaningful.",
    features: null,
    note: "You can update your Guardian settings and profile at any time from your dashboard.",
    button: "Get started",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: if already completed, bounce out
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile?.onboardingComplete) {
          router.replace(data.profile.profileSetupComplete ? "/dashboard" : "/setup");
        }
      })
      .catch(() => {});
  }, [router]);

  const completeOnboarding = useCallback(async () => {
    if (completing) return; // prevent double-clicks
    setCompleting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", { method: "POST" });
      if (!res.ok) throw new Error("Failed to save");

      // Wait a beat for DB commit to propagate through pooler
      await new Promise(r => setTimeout(r, 300));

      // Redirect to setup (not dashboard — dashboard would redirect back here if race condition)
      router.push("/setup");
    } catch {
      setError("Something went wrong. Please try again.");
      setCompleting(false);
    }
  }, [completing, router]);

  function next() {
    if (current === SCREENS.length - 1) {
      completeOnboarding();
      return;
    }
    setCurrent(c => c + 1);
  }

  function skip() {
    completeOnboarding();
  }

  const screen = SCREENS[current];

  return (
    <div className="min-h-screen bg-sanctuary-surface flex flex-col selection:bg-sanctuary-primary-container">
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#466564 0.5px, transparent 0.5px), radial-gradient(#466564 0.5px, #fafaf5 0.5px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />

      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-8 max-w-7xl mx-auto z-10">
        <div className="text-xl font-serif italic font-bold text-sanctuary-primary tracking-tight">
          Proposal Card
        </div>
        {current < SCREENS.length - 1 && (
          <button
            onClick={skip}
            disabled={completing}
            className="text-[11px] uppercase tracking-widest text-sanctuary-outline hover:text-sanctuary-primary transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-grow flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-[480px] overflow-hidden">
          <div
            key={current}
            className="animate-slide-in text-center px-4"
          >
            <h1
              className="font-serif text-[28px] font-medium leading-tight mb-6"
              style={{ color: "#2D5A52" }}
            >
              {screen.headline}
            </h1>

            <p className="text-base text-sanctuary-on-surface-variant leading-[1.7] mb-8">
              {screen.body}
            </p>

            {screen.features && (
              <div className="space-y-4 mb-8">
                {screen.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center">
                    <span className="material-symbols-outlined text-sanctuary-primary text-[20px]">{f.icon}</span>
                    <span className="text-sm text-sanctuary-on-surface-variant">{f.label}</span>
                  </div>
                ))}
              </div>
            )}

            {screen.note && (
              <p className="text-sm italic text-sanctuary-outline mb-8">
                {screen.note}
              </p>
            )}

            {error && (
              <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={next}
              disabled={completing}
              className="w-full max-w-[280px] mx-auto py-4 font-medium text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#2D5A52" }}
            >
              <span>{completing ? "Setting up your account…" : screen.button}</span>
              {!completing && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </div>
        </div>
      </main>

      {/* Progress dots */}
      <footer className="w-full flex justify-center items-center py-8 z-10">
        <div className="flex gap-2">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i <= current ? "bg-sanctuary-primary" : "bg-sanctuary-surface-high"
              }`}
            />
          ))}
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
