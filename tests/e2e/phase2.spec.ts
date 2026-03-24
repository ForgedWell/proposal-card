import { test, expect, request as playwrightRequest } from "@playwright/test";

// Fresh unauthenticated context — no shared state, no redirect following
async function fresh() {
  return playwrightRequest.newContext({
    baseURL: "http://localhost:3000",
    storageState: { cookies: [], origins: [] },
    // Don't follow redirects — we want to see the raw 307 from middleware,
    // not the 200 from /login that it redirects to
    extraHTTPHeaders: {},
  });
}

// Make a request without following redirects
async function rawGet(path: string) {
  const ctx = await fresh();
  // Playwright's request context follows redirects by default and has no
  // per-request option to disable. We use fetch directly to get raw status.
  const res = await fetch(`http://localhost:3000${path}`, {
    redirect: "manual",
    headers: {},
  });
  await ctx.dispose();
  return res.status;
}

async function rawPost(path: string, body?: object) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

async function rawDelete(path: string) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "DELETE",
    redirect: "manual",
  });
  return res.status;
}

async function rawPatch(path: string, body?: object) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "PATCH",
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

// Unauthenticated requests to protected routes get either:
//   307 — middleware redirects to /login before the route handler runs
//   401 — route handler returns Unauthorized directly
// Both are valid "not authorized" responses depending on whether the route
// is in the middleware PUBLIC_PATHS list or not.
function expectUnauthorized(status: number) {
  expect([307, 401]).toContain(status);
}

// ─── Profile API — protected routes ──────────────────────────────────────────

test.describe("Profile API — auth protection", () => {
  test("GET /api/profile — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/profile"));
  });

  test("PATCH /api/profile — blocked without session", async () => {
    expectUnauthorized(await rawPatch("/api/profile", { displayName: "X" }));
  });

  test("POST /api/profile/card — blocked without session", async () => {
    expectUnauthorized(await rawPost("/api/profile/card"));
  });

  test("DELETE /api/profile/card — blocked without session", async () => {
    expectUnauthorized(await rawDelete("/api/profile/card"));
  });

  test("GET /api/profile/qr — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/profile/qr"));
  });

  test("GET /api/profile/wali — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/profile/wali"));
  });

  test("PATCH /api/profile/wali — blocked without session", async () => {
    expectUnauthorized(await rawPatch("/api/profile/wali", { waliActive: true }));
  });
});

// ─── Connection request — input validation (public route) ────────────────────

test.describe("POST /api/connect/request — validation", () => {
  test("returns 400 for empty body", async () => {
    const ctx = await fresh();
    expect((await ctx.post("/api/connect/request", { data: {} })).status()).toBe(400);
    await ctx.dispose();
  });

  test("returns 400 when intent is too short (<5 chars)", async () => {
    const ctx = await fresh();
    const res = await ctx.post("/api/connect/request", {
      data: { ownerId: "u1", name: "Bob", contact: "bob@example.com", intent: "Hi" },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test("returns 400 when name is missing", async () => {
    const ctx = await fresh();
    const res = await ctx.post("/api/connect/request", {
      data: { ownerId: "u1", contact: "bob@example.com", intent: "Would love to connect" },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test("returns 400 when contact is missing", async () => {
    const ctx = await fresh();
    const res = await ctx.post("/api/connect/request", {
      data: { ownerId: "u1", name: "Bob", intent: "Would love to connect" },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test("returns 404 for non-existent owner ID", async () => {
    const ctx = await fresh();
    const res = await ctx.post("/api/connect/request", {
      data: {
        ownerId:  "nonexistent-owner-xyz-123",
        name:     "Bob",
        contact:  "bob@example.com",
        intent:   "Would love to connect with you",
      },
    });
    expect(res.status()).toBe(404);
    await ctx.dispose();
  });
});

// ─── Connection requests management — protected ───────────────────────────────

test.describe("Connection requests API — auth protection", () => {
  test("GET /api/connect/requests — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/connect/requests"));
  });

  test("PATCH /api/connect/requests — blocked without session", async () => {
    expectUnauthorized(await rawPatch("/api/connect/requests", { requestId: "r1", action: "approve" }));
  });
});

// ─── Messages API — protected ────────────────────────────────────────────────

test.describe("Messages API — auth protection", () => {
  test("GET /api/connect/messages — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/connect/messages?connectionId=c1"));
  });

  test("POST /api/connect/messages — blocked without session", async () => {
    expectUnauthorized(await rawPost("/api/connect/messages", { connectionId: "c1", body: "Hello" }));
  });
});

// ─── Proxy API — protected ────────────────────────────────────────────────────

test.describe("Proxy API — auth protection", () => {
  test("POST /api/connect/proxy — blocked without session", async () => {
    expectUnauthorized(await rawPost("/api/connect/proxy", { connectionId: "c1", prospectPhone: "+15551234567" }));
  });

  test("DELETE /api/connect/proxy — blocked without session", async () => {
    expectUnauthorized(await rawDelete("/api/connect/proxy?connectionId=c1"));
  });

  test("GET /api/connect/proxy — blocked without session", async () => {
    expectUnauthorized(await rawGet("/api/connect/proxy?connectionId=c1"));
  });
});

// ─── Public card page ─────────────────────────────────────────────────────────

test.describe("Public card page /c/[slug]", () => {
  test("returns 404 for non-existent slug", async ({ page }) => {
    const res = await page.goto("/c/this-slug-does-not-exist-xyz123");
    expect(res?.status()).toBe(404);
  });

  test("404 page renders without crashing", async ({ page }) => {
    await page.goto("/c/nonexistent-slug-xyz");
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(10);
  });
});

// ─── Dashboard auth-protection ────────────────────────────────────────────────

test.describe("Dashboard auth protection", () => {
  test("redirects to /login without session", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
