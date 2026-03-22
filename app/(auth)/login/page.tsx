"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("email");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "email" ? { type: "email", email: value } : { type: "phone", phone: value }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }

      // Store contact info for verify page
      sessionStorage.setItem("otp_type", mode);
      sessionStorage.setItem("otp_target", value);
      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Proposal Card</h1>
          <p className="text-slate-500 mt-1">Sign in or create your account</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("email"); setValue(""); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "email"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setMode("phone"); setValue(""); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "phone"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Phone
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {mode === "email" ? "Email address" : "Phone number"}
            </label>
            <input
              type={mode === "email" ? "email" : "tel"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "email" ? "you@example.com" : "+1 555 000 0000"}
              required
              className="input-field"
            />
            {mode === "phone" && (
              <p className="text-xs text-slate-400 mt-1.5">
                Include country code (e.g. +1 for US)
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading || !value} className="btn-primary">
            {loading ? "Sending…" : "Send code →"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
