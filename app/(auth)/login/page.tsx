"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }

      sessionStorage.setItem("otp_type", "email");
      sessionStorage.setItem("otp_target", email);
      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-sanctuary-surface min-h-screen flex flex-col selection:bg-sanctuary-primary-container">
      {/* Geometric pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#466564 0.5px, transparent 0.5px), radial-gradient(#466564 0.5px, #fafaf5 0.5px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />

      {/* Top bar */}
      <header className="w-full flex justify-between items-center px-6 py-8 max-w-7xl mx-auto z-10">
        <div className="text-xl font-serif italic font-bold text-sanctuary-primary tracking-tight">
          Proposal Card
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 relative">
        <div className="w-full max-w-[440px] z-10">
          {/* Sign-in card */}
          <section className="bg-sanctuary-surface-lowest rounded-xl p-10 md:p-12 shadow-[0px_12px_32px_rgba(47,52,46,0.04)] relative overflow-hidden">
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
              <h1 className="font-serif italic text-3xl text-sanctuary-on-surface mb-3">Welcome back</h1>
              <p className="text-sanctuary-on-surface-variant text-sm leading-relaxed max-w-[320px]">
                Continue your journey toward a meaningful union in our private sanctuary.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-sanctuary-outline mb-2 ml-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3.5 rounded-lg bg-sanctuary-surface-low border border-sanctuary-outline-variant/15 text-sanctuary-on-surface placeholder:text-sanctuary-outline/50 transition-all duration-300 focus:outline-none focus:border-sanctuary-primary focus:shadow-[0_0_0_2px_rgba(70,101,100,0.1)]"
                />
              </div>

              {error && (
                <p className="text-sm text-sanctuary-error bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 bg-gradient-to-br from-sanctuary-primary to-sanctuary-primary-dim text-sanctuary-on-primary font-medium rounded-lg shadow-sm hover:opacity-95 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Sending…" : "Send magic link"}</span>
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-sanctuary-surface-container" />
              <span className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Intentional Discovery</span>
              <div className="h-[1px] flex-grow bg-sanctuary-surface-container" />
            </div>

            {/* Security note */}
            <div className="text-center">
              <div className="bg-sanctuary-surface-low rounded-lg p-4 flex items-start gap-3 text-left">
                <span className="material-symbols-outlined text-sanctuary-primary text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                <p className="text-[11px] leading-relaxed text-sanctuary-on-surface-variant">
                  Our sanctuary uses magic links for higher security. We will never share your email with third parties or display it on your public card.
                </p>
              </div>
            </div>
          </section>

          {/* Footer links */}
          <footer className="mt-8 flex flex-col items-center gap-4">
            <nav className="flex gap-6">
              <a href="/terms" className="text-[10px] uppercase tracking-widest text-sanctuary-outline hover:text-sanctuary-primary transition-colors">Terms of Service</a>
              <a href="/privacy-policy" className="text-[10px] uppercase tracking-widest text-sanctuary-outline hover:text-sanctuary-primary transition-colors">Privacy Policy</a>
            </nav>
          </footer>
        </div>
      </main>

      {/* Side graphic (desktop) */}
      <div className="hidden lg:block fixed right-0 top-0 h-full w-1/4 pointer-events-none">
        <div className="h-full w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-sanctuary-primary/5" />
          <div className="absolute bottom-12 left-0 right-0 px-12">
            <blockquote className="font-serif italic text-sanctuary-primary-dim text-lg leading-relaxed">
              &ldquo;Finding a partner is a sacred journey. We provide the space to treat it as such.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
