import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));

import { db } from "@/lib/db";
import { recordContactAttempt, checkRateLimit } from "@/lib/safety/rate-limit";

const mdb = db as any;

describe("rate-limit", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("recordContactAttempt", () => {
    it("creates a contact attempt record", async () => {
      mdb.contactAttempt.create.mockResolvedValue({ id: "ca1" });

      await recordContactAttempt("owner1", "1.2.3.4", "Test@Email.com");

      expect(mdb.contactAttempt.create).toHaveBeenCalledWith({
        data: { ownerId: "owner1", ip: "1.2.3.4", contact: "test@email.com" },
      });
    });

    it("handles null IP and contact", async () => {
      mdb.contactAttempt.create.mockResolvedValue({ id: "ca2" });

      await recordContactAttempt("owner1", null, null);

      expect(mdb.contactAttempt.create).toHaveBeenCalledWith({
        data: { ownerId: "owner1", ip: null, contact: null },
      });
    });
  });

  describe("checkRateLimit", () => {
    it("allows when under both limits", async () => {
      mdb.contactAttempt.count.mockResolvedValue(2);

      const result = await checkRateLimit("owner1", "1.2.3.4", "test@email.com");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("blocks when contact limit exceeded", async () => {
      // First count call (per-contact) returns 5 (at limit)
      mdb.contactAttempt.count.mockResolvedValueOnce(5);

      const result = await checkRateLimit("owner1", "1.2.3.4", "test@email.com");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("blocks when IP limit exceeded", async () => {
      // First count call (per-contact) returns 2 (under limit)
      mdb.contactAttempt.count.mockResolvedValueOnce(2);
      // Second count call (per-IP) returns 15 (at limit)
      mdb.contactAttempt.count.mockResolvedValueOnce(15);

      const result = await checkRateLimit("owner1", "1.2.3.4", "test@email.com");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("allows when only IP provided (no contact)", async () => {
      // Only IP check runs, returns under limit
      mdb.contactAttempt.count.mockResolvedValue(3);

      const result = await checkRateLimit("owner1", "1.2.3.4", null);

      expect(result.allowed).toBe(true);
    });

    it("allows when only contact provided (no IP)", async () => {
      mdb.contactAttempt.count.mockResolvedValue(2);

      const result = await checkRateLimit("owner1", null, "test@email.com");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3); // 5 - 2
    });
  });
});
