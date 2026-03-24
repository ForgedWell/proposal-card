import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/email/resend", () => ({ sendOtpEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from "@/app/api/auth/send-otp/route";
import { sendOtpEmail } from "@/lib/email/resend";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  db.otpCode.updateMany.mockResolvedValue({ count: 0 });
  db.user.findUnique.mockResolvedValue(null);
  db.otpCode.create.mockResolvedValue({});
});

// ─── Email OTP ────────────────────────────────────────────────────────────────

describe("POST /api/auth/send-otp — email", () => {
  it("returns 200 and calls sendOtpEmail for valid email", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendOtpEmail).toHaveBeenCalledWith("test@example.com", expect.stringMatching(/^\d{6}$/));
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ type: "email", email: "not-an-email" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid input");
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ type: "email" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when sendOtpEmail throws", async () => {
    vi.mocked(sendOtpEmail).mockRejectedValueOnce(new Error("Resend down"));

    const res = await POST(makeRequest({ type: "email", email: "test@example.com" }));
    expect(res.status).toBe(500);
  });
});

// ─── Phone OTP removed — email only ──────────────────────────────────────────

describe("POST /api/auth/send-otp — phone rejected", () => {
  it("returns 400 for phone type (email only now)", async () => {
    const res = await POST(makeRequest({ type: "phone", phone: "+15551234567" }));
    expect(res.status).toBe(400);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/auth/send-otp — validation", () => {
  it("returns 400 for missing type", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown type", async () => {
    const res = await POST(makeRequest({ type: "magic", email: "test@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty body", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
