import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));

import { createEmailOtp, verifyEmailOtp } from "@/lib/auth/otp";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createEmailOtp ───────────────────────────────────────────────────────────

describe("createEmailOtp", () => {
  it("invalidates existing OTPs for that email", async () => {
    db.otpCode.updateMany.mockResolvedValue({ count: 1 });
    db.user.findUnique.mockResolvedValue(null);
    db.otpCode.create.mockResolvedValue({});

    await createEmailOtp("user@example.com");

    expect(db.otpCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ target: "user@example.com" }),
      })
    );
  });

  it("returns a 6-digit numeric string", async () => {
    db.otpCode.updateMany.mockResolvedValue({ count: 0 });
    db.user.findUnique.mockResolvedValue(null);
    db.otpCode.create.mockResolvedValue({});

    const code = await createEmailOtp("user@example.com");

    expect(code).toMatch(/^\d{6}$/);
  });

  it("links the OTP to an existing user when found", async () => {
    db.otpCode.updateMany.mockResolvedValue({ count: 0 });
    db.user.findUnique.mockResolvedValue({ id: "user-123" });
    db.otpCode.create.mockResolvedValue({});

    await createEmailOtp("existing@example.com");

    expect(db.otpCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-123" }),
      })
    );
  });

  it("sets userId to null for new (unknown) email", async () => {
    db.otpCode.updateMany.mockResolvedValue({ count: 0 });
    db.user.findUnique.mockResolvedValue(null);
    db.otpCode.create.mockResolvedValue({});

    await createEmailOtp("new@example.com");

    expect(db.otpCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: null }),
      })
    );
  });

  it("sets expiry ~10 minutes in the future", async () => {
    db.otpCode.updateMany.mockResolvedValue({ count: 0 });
    db.user.findUnique.mockResolvedValue(null);

    let capturedExpiry: Date | undefined;
    db.otpCode.create.mockImplementation(async ({ data }: any) => {
      capturedExpiry = data.expiresAt;
      return {};
    });

    const before = Date.now();
    await createEmailOtp("user@example.com");
    const after = Date.now();

    const expMs = capturedExpiry!.getTime();
    expect(expMs).toBeGreaterThanOrEqual(before + 9.9 * 60 * 1000);
    expect(expMs).toBeLessThanOrEqual(after + 10.1 * 60 * 1000);
  });
});

// ─── verifyEmailOtp ───────────────────────────────────────────────────────────

describe("verifyEmailOtp", () => {
  it("returns valid: false when no OTP record found", async () => {
    db.otpCode.findFirst.mockResolvedValue(null);

    const result = await verifyEmailOtp("user@example.com", "123456");

    expect(result).toEqual({ valid: false });
  });

  it("returns valid: false when code does not match", async () => {
    db.otpCode.findFirst.mockResolvedValue({
      id: "otp-1",
      code: "999999",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await verifyEmailOtp("user@example.com", "123456");

    expect(result).toEqual({ valid: false });
  });

  it("marks OTP as used and upserts user on success", async () => {
    db.otpCode.findFirst.mockResolvedValue({
      id: "otp-1",
      code: "123456",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    db.otpCode.update.mockResolvedValue({});
    db.user.upsert.mockResolvedValue({ id: "user-abc" });

    const result = await verifyEmailOtp("user@example.com", "123456");

    expect(db.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "otp-1" } })
    );
    expect(db.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } })
    );
    expect(result).toEqual({ valid: true, userId: "user-abc" });
  });

  it("returns valid: true with the correct userId", async () => {
    db.otpCode.findFirst.mockResolvedValue({ id: "otp-2", code: "654321" });
    db.otpCode.update.mockResolvedValue({});
    db.user.upsert.mockResolvedValue({ id: "user-xyz" });

    const result = await verifyEmailOtp("another@example.com", "654321");

    expect(result.valid).toBe(true);
    expect(result.userId).toBe("user-xyz");
  });
});
