import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/sms/twilio", () => ({
  sendPhoneOtp: vi.fn(),
  verifyPhoneOtp: vi.fn(),
}));

import { POST } from "@/app/api/auth/verify-otp/route";
import { verifyPhoneOtp } from "@/lib/sms/twilio";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/verify-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

const validOtpRecord = {
  id: "otp-1",
  code: "123456",
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
};

beforeEach(() => {
  vi.clearAllMocks();
  db.otpCode.findFirst.mockResolvedValue(validOtpRecord);
  db.otpCode.update.mockResolvedValue({});
  db.user.upsert.mockResolvedValue({ id: "user-abc" });
  db.session.create.mockResolvedValue({});
});

// ─── Email verification ───────────────────────────────────────────────────────

describe("POST /api/auth/verify-otp — email", () => {
  it("returns 200 and sets session cookie on valid code", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.redirect).toBe("/dashboard");

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
  });

  it("returns 401 for wrong code", async () => {
    db.otpCode.findFirst.mockResolvedValue({ ...validOtpRecord, code: "999999" });

    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid or expired code");
  });

  it("returns 401 when no OTP exists", async () => {
    db.otpCode.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ type: "email", email: "bad", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for code not 6 digits", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123" }));
    expect(res.status).toBe(400);
  });
});

// ─── Phone verification ───────────────────────────────────────────────────────

describe("POST /api/auth/verify-otp — phone", () => {
  it("returns 200 and sets session cookie on valid Twilio verification", async () => {
    vi.mocked(verifyPhoneOtp).mockResolvedValue(true);
    db.user.upsert.mockResolvedValue({ id: "user-phone-1" });

    const res = await POST(makeRequest({ type: "phone", phone: "+15551234567", code: "654321" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("session=");
  });

  it("returns 401 when Twilio returns invalid", async () => {
    vi.mocked(verifyPhoneOtp).mockResolvedValue(false);

    const res = await POST(makeRequest({ type: "phone", phone: "+15551234567", code: "000000" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid or expired code");
  });

  it("upserts user by phone on success", async () => {
    vi.mocked(verifyPhoneOtp).mockResolvedValue(true);
    db.user.upsert.mockResolvedValue({ id: "user-phone-2" });

    await POST(makeRequest({ type: "phone", phone: "+15559876543", code: "654321" }));

    expect(db.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: "+15559876543" } })
    );
  });
});

// ─── Session cookie properties ────────────────────────────────────────────────

describe("POST /api/auth/verify-otp — session cookie", () => {
  it("cookie has correct max-age (7 days)", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    const cookie = res.headers.get("set-cookie") ?? "";

    // 604800 = 7 * 24 * 60 * 60
    expect(cookie.toLowerCase()).toMatch(/max-age=604800/i);
  });

  it("cookie has SameSite=Lax", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("cookie path is /", async () => {
    const res = await POST(makeRequest({ type: "email", email: "test@example.com", code: "123456" }));
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(cookie).toContain("Path=/");
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/auth/verify-otp — validation", () => {
  it("returns 400 for missing type", async () => {
    const res = await POST(makeRequest({ email: "test@example.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty body", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
