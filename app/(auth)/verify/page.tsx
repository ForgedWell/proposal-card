"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [otpType, setOtpType] = useState<"email" | "phone">("email");
  const [otpTarget, setOtpTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const type = sessionStorage.getItem("otp_type") as "email" | "phone";
    const target = sessionStorage.getItem("otp_target");
    if (!type || !target) {
      router.push("/login");
      return;
    }
    setOtpType(type);
    setOtpTarget(target);
    // Focus first input
    inputRefs.current[0]?.focus();
  }, [router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleDigitChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");

    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && idx === 5 && next.every((d) => d)) {
      submitCode(next.join(""));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      submitCode(pasted);
    }
  }

  async function submitCode(fullCode: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          otpType === "email"
            ? { type: "email", email: otpTarget, code: fullCode }
            : { type: "phone", phone: otpTarget, code: fullCode }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      sessionStorage.removeItem("otp_type");
      sessionStorage.removeItem("otp_target");
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendCooldown(30);
    setError("");
    setCode(["", "", "", "", "", ""]);

    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        otpType === "email"
          ? { type: "email", email: otpTarget }
          : { type: "phone", phone: otpTarget }
      ),
    });

    inputRefs.current[0]?.focus();
  }

  const maskedTarget =
    otpType === "email"
      ? otpTarget.replace(/(.{2})(.*)(@.*)/, "$1***$3")
      : otpTarget.replace(/(\+\d{1,3})(\d+)(\d{2})/, "$1 *** $3");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-slate-500 hover:text-slate-700 mb-8 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wide">
              {otpType === "email" ? "Email" : "Phone"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Check your {otpType}</h1>
          <p className="text-slate-500 mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-slate-700">{maskedTarget}</span>
          </p>
        </div>

        {/* OTP Input Grid */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-colors focus:outline-none focus:border-brand-500 bg-white
                ${digit ? "border-brand-400 text-brand-700" : "border-slate-200 text-slate-900"}
                ${loading ? "opacity-50" : ""}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center mb-4">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-center text-sm text-slate-500 mb-4">Verifying…</p>
        )}

        {/* Resend */}
        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-slate-400">Resend in {resendCooldown}s</p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
