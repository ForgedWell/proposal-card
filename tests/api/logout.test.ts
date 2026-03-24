import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ db }));

import { POST } from "@/app/api/auth/logout/route";

function makeRequest(sessionCookie?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (sessionCookie) {
    headers.set("cookie", `session=${sessionCookie}`);
  }
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.session.deleteMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/auth/logout", () => {
  it("returns 200 with success: true", async () => {
    const res = await POST(makeRequest("some-valid-token"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("revokes the session token from DB", async () => {
    await POST(makeRequest("my-session-token"));

    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { token: "my-session-token" },
    });
  });

  it("clears the session cookie (max-age=0)", async () => {
    const res = await POST(makeRequest("some-token"));
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(cookie).toContain("session=");
    expect(cookie.toLowerCase()).toContain("max-age=0");
  });

  it("still returns 200 when no session cookie is present", async () => {
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Should not attempt DB revocation with no token
    expect(db.session.deleteMany).not.toHaveBeenCalled();
  });
});
