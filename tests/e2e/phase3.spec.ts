import { test, expect } from "@playwright/test";

async function rawPost(path: string, body?: object) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function rawGet(path: string) {
  const res = await fetch(`http://localhost:3000${path}`, { redirect: "manual" });
  return { status: res.status, contentType: res.headers.get("content-type") };
}

// ─── Safety API routes (require auth → redirect for unauthenticated) ─────────

test.describe("Phase 3 — Safety APIs (unauthenticated)", () => {
  test("GET /api/safety/block redirects without session", async () => {
    const { status } = await rawGet("/api/safety/block");
    expect(status).toBe(307);
  });

  test("POST /api/safety/block redirects without session", async () => {
    const { status } = await rawPost("/api/safety/block", { contact: "test@example.com" });
    expect(status).toBe(307);
  });

  test("POST /api/safety/report redirects without session", async () => {
    const { status } = await rawPost("/api/safety/report", { category: "SPAM" });
    expect(status).toBe(307);
  });
});

// ─── Connect request with rate limiting + block check ────────────────────────

test.describe("Phase 3 — Contact request safety", () => {
  test("POST /api/connect/request validates input", async () => {
    const { status, body } = await rawPost("/api/connect/request", {});
    expect(status).toBe(400);
    expect(body?.error).toBe("Invalid input");
  });

  test("POST /api/connect/request rejects missing ownerId", async () => {
    const { status } = await rawPost("/api/connect/request", {
      name: "Test",
      contact: "test@example.com",
      intent: "Just testing the form",
    });
    expect(status).toBe(400);
  });

  test("POST /api/connect/request returns 404 for non-existent owner", async () => {
    const { status } = await rawPost("/api/connect/request", {
      ownerId: "nonexistent-user-id",
      name: "Test Person",
      contact: "test@example.com",
      intent: "Hello, I would like to connect",
    });
    expect([404, 500]).toContain(status);
  });
});

// ─── Card PDF endpoint ───────────────────────────────────────────────────────

test.describe("Phase 3 — Card PDF", () => {
  test("GET /api/profile/card-pdf redirects without session", async () => {
    const { status } = await rawGet("/api/profile/card-pdf");
    expect(status).toBe(307);
  });
});

// ─── Profile visibility endpoint ─────────────────────────────────────────────

test.describe("Phase 3 — Profile API with visibility", () => {
  test("PATCH /api/profile redirects without session", async () => {
    const res = await fetch("http://localhost:3000/api/profile", {
      method: "PATCH",
      redirect: "manual",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldVisibility: { photoUrl: true } }),
    });
    expect(res.status).toBe(307);
  });
});
