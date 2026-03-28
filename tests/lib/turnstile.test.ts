import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyTurnstile } from "@/lib/safety/turnstile";

describe("verifyTurnstile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns true when no secret key is configured (dev/test)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(await verifyTurnstile("any-token")).toBe(true);
  });

  it("returns true on successful verification", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    (fetch as any).mockResolvedValue({
      json: async () => ({ success: true }),
    });

    expect(await verifyTurnstile("valid-token", "1.2.3.4")).toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          secret: "test-secret",
          response: "valid-token",
          remoteip: "1.2.3.4",
        }),
      })
    );
  });

  it("returns false on failed verification", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    (fetch as any).mockResolvedValue({
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    });

    expect(await verifyTurnstile("bad-token")).toBe(false);
  });

  it("omits remoteip when not provided", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    (fetch as any).mockResolvedValue({
      json: async () => ({ success: true }),
    });

    await verifyTurnstile("token");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ secret: "test-secret", response: "token" }),
      })
    );
  });
});
