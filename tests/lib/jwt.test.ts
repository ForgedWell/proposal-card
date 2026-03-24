import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));

import { signToken, verifyToken, createSession, revokeSession, validateSession } from "@/lib/auth/jwt";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── signToken / verifyToken ──────────────────────────────────────────────────

describe("signToken + verifyToken", () => {
  it("round-trips a payload correctly", async () => {
    const payload = { userId: "u1", sessionId: "s1" };
    const token = await signToken(payload);
    const decoded = await verifyToken(token);

    expect(decoded?.userId).toBe("u1");
    expect(decoded?.sessionId).toBe("s1");
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken({ userId: "u1", sessionId: "s1" });
    const tampered = token.slice(0, -5) + "XXXXX";

    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it("returns null for a completely invalid string", async () => {
    const result = await verifyToken("not.a.jwt");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await verifyToken("");
    expect(result).toBeNull();
  });
});

// ─── createSession ────────────────────────────────────────────────────────────

describe("createSession", () => {
  it("persists the session to the DB and returns a valid token", async () => {
    db.session.create.mockResolvedValue({});

    const token = await createSession("user-1");

    expect(db.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", token }),
      })
    );
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("stores an expiry ~7 days from now", async () => {
    let capturedExpiry: Date | undefined;
    db.session.create.mockImplementation(async ({ data }: any) => {
      capturedExpiry = data.expiresAt;
      return {};
    });

    const before = Date.now();
    await createSession("user-2");
    const after = Date.now();

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(capturedExpiry!.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(capturedExpiry!.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});

// ─── revokeSession ────────────────────────────────────────────────────────────

describe("revokeSession", () => {
  it("deletes the session record matching the token", async () => {
    db.session.deleteMany.mockResolvedValue({ count: 1 });

    await revokeSession("some-token");

    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { token: "some-token" } });
  });
});

// ─── validateSession ──────────────────────────────────────────────────────────

describe("validateSession", () => {
  it("returns null for an invalid JWT", async () => {
    const result = await validateSession("bad-token");
    expect(result).toBeNull();
  });

  it("returns null when session is not found in DB", async () => {
    const token = await signToken({ userId: "u1", sessionId: "s1" });
    db.session.findUnique.mockResolvedValue(null);

    const result = await validateSession(token);
    expect(result).toBeNull();
  });

  it("returns null and deletes an expired session", async () => {
    const token = await signToken({ userId: "u1", sessionId: "s1" });
    db.session.findUnique.mockResolvedValue({
      token,
      expiresAt: new Date(Date.now() - 1000), // expired
      user: { id: "u1", email: "u@test.com" },
    });
    db.session.delete.mockResolvedValue({});

    const result = await validateSession(token);

    expect(result).toBeNull();
    expect(db.session.delete).toHaveBeenCalledWith({ where: { token } });
  });

  it("returns the user for a valid, non-expired session", async () => {
    const token = await signToken({ userId: "u1", sessionId: "s1" });
    const mockUser = { id: "u1", email: "u@test.com" };
    db.session.findUnique.mockResolvedValue({
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      user: mockUser,
    });

    const result = await validateSession(token);

    expect(result).toEqual(mockUser);
  });
});
