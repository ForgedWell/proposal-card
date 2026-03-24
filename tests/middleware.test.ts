import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ db }));

import { middleware } from "@/middleware";
import { signToken } from "@/lib/auth/jwt";

function makeReq(path: string, sessionCookie?: string) {
  const url = `http://localhost${path}`;
  const headers = new Headers();
  if (sessionCookie) headers.set("cookie", `session=${sessionCookie}`);
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Public paths ─────────────────────────────────────────────────────────────

describe("middleware — public paths", () => {
  it("allows /login without a session", async () => {
    const res = await middleware(makeReq("/login"));
    expect(res.status).not.toBe(302);
  });

  it("allows /verify without a session", async () => {
    const res = await middleware(makeReq("/verify"));
    expect(res.status).not.toBe(302);
  });

  it("allows /api/auth/send-otp without a session", async () => {
    const res = await middleware(makeReq("/api/auth/send-otp"));
    expect(res.status).not.toBe(302);
  });

  it("allows /api/auth/verify-otp without a session", async () => {
    const res = await middleware(makeReq("/api/auth/verify-otp"));
    expect(res.status).not.toBe(302);
  });

  it("allows /api/auth/logout without a session", async () => {
    const res = await middleware(makeReq("/api/auth/logout"));
    expect(res.status).not.toBe(302);
  });
});

// ─── Protected paths — unauthenticated ────────────────────────────────────────

describe("middleware — protected paths, no session", () => {
  it("redirects /dashboard to /login when no cookie", async () => {
    const res = await middleware(makeReq("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects / to /login when no cookie", async () => {
    const res = await middleware(makeReq("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});

// ─── Protected paths — invalid token ──────────────────────────────────────────

describe("middleware — protected paths, bad token", () => {
  it("redirects /dashboard to /login with tampered JWT", async () => {
    const res = await middleware(makeReq("/dashboard", "garbage.token.value"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("clears cookie when token is invalid", async () => {
    const res = await middleware(makeReq("/dashboard", "bad-token"));
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie.toLowerCase()).toContain("max-age=0");
  });
});

// ─── Protected paths — valid token ────────────────────────────────────────────

describe("middleware — protected paths, valid token", () => {
  it("allows /dashboard through with a valid JWT", async () => {
    const token = await signToken({ userId: "u1", sessionId: "s1" });
    const res = await middleware(makeReq("/dashboard", token));
    expect(res.status).not.toBe(307);
  });
});
