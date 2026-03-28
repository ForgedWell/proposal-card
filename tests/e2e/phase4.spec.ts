import { test, expect } from "@playwright/test";

async function rawPost(path: string, body?: object) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status };
}

async function rawGet(path: string) {
  const res = await fetch(`http://localhost:3000${path}`, { redirect: "manual" });
  return { status: res.status };
}

test.describe("Phase 4 — Safety panic API (unauthenticated)", () => {
  test("POST /api/safety/panic redirects without session", async () => {
    const { status } = await rawPost("/api/safety/panic");
    expect(status).toBe(307);
  });
});

test.describe("Phase 4 — Card PDF with template", () => {
  test("GET /api/profile/card-pdf redirects without session", async () => {
    const { status } = await rawGet("/api/profile/card-pdf");
    expect(status).toBe(307);
  });
});

test.describe("Phase 4 — Profile API accepts card design fields", () => {
  test("PATCH /api/profile redirects without session", async () => {
    const res = await fetch("http://localhost:3000/api/profile", {
      method: "PATCH",
      redirect: "manual",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardTemplate: "ELEGANT", cardColor: "#7c3aed" }),
    });
    expect(res.status).toBe(307);
  });
});
