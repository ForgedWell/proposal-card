"use client";

import { useState } from "react";
import { z } from "zod";

interface Props {
  ownerId: string;
  ownerSlug: string;
}

const schema = z.object({
  name:    z.string().min(1, "Name is required").max(80),
  contact: z.string().min(3, "Email or phone required").max(100),
  intent:  z.string().min(5, "Please add a brief message").max(300),
});

type Step = "idle" | "form" | "submitting" | "done" | "error";

export default function ContactButton({ ownerId, ownerSlug }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [form, setForm] = useState({ name: "", contact: "", intent: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[field] = msgs?.[0] ?? "";
      }
      setErrors(fieldErrors);
      return;
    }

    setStep("submitting");
    try {
      const res = await fetch("/api/connect/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, ...parsed.data }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Something went wrong");
        setStep("form");
        return;
      }

      setStep("done");
    } catch {
      setServerError("Network error — please try again");
      setStep("form");
    }
  }

  if (step === "done") {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-sm font-medium text-slate-700">Request sent</p>
        <p className="text-xs text-slate-400 mt-1">
          You'll be notified if they accept your request.
        </p>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("form")}
        className="btn-primary w-full"
      >
        Request Contact
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-left space-y-3 mt-2">
      <div>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          className="input-field text-sm"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="Your email or phone"
          className="input-field text-sm"
        />
        {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
      </div>
      <div>
        <textarea
          name="intent"
          value={form.intent}
          onChange={handleChange}
          placeholder="Brief message (why you're reaching out)"
          rows={3}
          className="input-field text-sm resize-none"
        />
        {errors.intent && <p className="text-xs text-red-500 mt-1">{errors.intent}</p>}
      </div>

      {serverError && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={step === "submitting"}
          className="flex-1 btn-primary py-2.5 text-sm"
        >
          {step === "submitting" ? "Sending…" : "Send Request"}
        </button>
      </div>
    </form>
  );
}
