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
    inputRefs.current[0]?.focus();
  }, [router]);

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
        body: JSON.stringify({
          type: "email",
          email: otpTarget,
          code: fullCode,
          ...(typeof window !== "undefined" && sessionStorage.getItem("otp_role") && { role: sessionStorage.getItem("otp_role") }),
          ...(typeof window !== "undefined" && sessionStorage.getItem("otp_ward") && { ward: sessionStorage.getItem("otp_ward") }),
        }),
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
      sessionStorage.removeItem("otp_role");
      sessionStorage.removeItem("otp_ward");
      router.push(data.redirect ?? "/dashboard");
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
          <section className="bg-sanctuary-surface-lowest rounded-xl p-10 md:p-12 shadow-[0px_12px_32px_rgba(47,52,46,0.04)] relative overflow-hidden">
            {/* Back link */}
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-sanctuary-outline hover:text-sanctuary-primary mb-8 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>

            {/* Header */}
            <div className="mb-10 text-center">
              <div className="w-12 h-12 bg-sanctuary-primary-container rounded-xl flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-sanctuary-primary text-[24px]">mail</span>
              </div>
              <h1 className="font-serif italic text-3xl text-sanctuary-on-surface mb-3">
                Check your {otpType}
              </h1>
              <p className="text-sanctuary-on-surface-variant text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-sanctuary-on-surface">{maskedTarget}</span>
              </p>
            </div>

            {/* OTP Input Grid */}
            <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
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
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-lg transition-all duration-200 focus:outline-none
                    ${digit
                      ? "bg-sanctuary-primary-container/30 border-2 border-sanctuary-primary text-sanctuary-primary"
                      : "bg-sanctuary-surface-low border border-sanctuary-outline-variant/15 text-sanctuary-on-surface"
                    }
                    ${loading ? "opacity-50" : ""}
                    focus:border-sanctuary-primary focus:shadow-[0_0_0_2px_rgba(70,101,100,0.1)]
                  `}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-sanctuary-error bg-sanctuary-tertiary/5 rounded-lg px-3 py-2 text-center mb-4">
                {error}
              </p>
            )}

            {loading && (
              <p className="text-center text-sm text-sanctuary-outline mb-4">Verifying…</p>
            )}

            {/* Resend */}
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-sm text-sanctuary-outline">Resend in {resendCooldown}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm text-sanctuary-primary hover:text-sanctuary-primary-dim font-semibold transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-sanctuary-surface-container" />
              <span className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Secure Verification</span>
              <div className="h-[1px] flex-grow bg-sanctuary-surface-container" />
            </div>

            {/* Security note */}
            <div className="bg-sanctuary-surface-low rounded-lg p-4 flex items-start gap-3 text-left">
              <span className="material-symbols-outlined text-sanctuary-primary text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <p className="text-[11px] leading-relaxed text-sanctuary-on-surface-variant">
                This code expires in 10 minutes. If you didn&apos;t request this, you can safely ignore it.
              </p>
            </div>
          </section>

          {/* Footer */}
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
