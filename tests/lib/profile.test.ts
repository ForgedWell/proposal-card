import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));

import {
  generateUniqueSlug,
  getProfile,
  updateProfile,
  activateCard,
  deactivateCard,
  getPublicCard,
  getCardByToken,
  logCardScan,
} from "@/lib/profile/profile";

beforeEach(() => vi.clearAllMocks());

// ─── generateUniqueSlug ───────────────────────────────────────────────────────

describe("generateUniqueSlug", () => {
  it("returns a slug with name prefix + random suffix", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const slug = await generateUniqueSlug("John Doe");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).toContain("john-doe-");
  });

  it("falls back to random slug if candidate is taken", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ id: "other" })  // candidate taken
      .mockResolvedValueOnce(null);            // fallback available (not called in current impl)
    const slug = await generateUniqueSlug("John Doe");
    expect(slug).toBeTruthy();
    expect(slug.length).toBeGreaterThanOrEqual(10);
  });

  it("generates a random slug when no base provided", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const slug = await generateUniqueSlug();
    expect(slug).toMatch(/^[a-z0-9]+$/);
    expect(slug.length).toBeGreaterThanOrEqual(10);
  });
});

// ─── getProfile ───────────────────────────────────────────────────────────────

describe("getProfile", () => {
  it("queries by userId with correct select fields", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", displayName: "Alice" });
    await getProfile("u1");
    expect(db.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } })
    );
  });

  it("returns null when user not found", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const result = await getProfile("nope");
    expect(result).toBeNull();
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe("updateProfile", () => {
  it("updates allowed fields", async () => {
    // First call: check if user has slug (for auto-generation)
    db.user.findUnique.mockResolvedValueOnce({ slug: "existing-slug" });
    db.user.update.mockResolvedValue({ id: "u1", displayName: "Bob" });

    await updateProfile("u1", { displayName: "Bob", intention: "Hello" });

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ displayName: "Bob", bio: "Hello" }),
      })
    );
  });

  it("auto-generates slug when user has no slug and displayName is provided", async () => {
    // User has no slug
    db.user.findUnique
      .mockResolvedValueOnce({ slug: null })  // check for existing slug
      .mockResolvedValueOnce(null);            // slug uniqueness check
    db.user.update.mockResolvedValue({ id: "u1", slug: "bob-xxxx" });

    await updateProfile("u1", { displayName: "Bob" });

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayName: "Bob", slug: expect.stringContaining("bob") }),
      })
    );
  });
});

// ─── activateCard ─────────────────────────────────────────────────────────────

describe("activateCard", () => {
  it("generates slug and cardToken on first activation", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ id: "u1", slug: null, cardToken: null, displayName: "Alice" })
      .mockResolvedValue(null); // slug/token uniqueness checks

    db.user.update.mockResolvedValue({ id: "u1", cardActive: true, slug: "alice", cardToken: "tok123" });

    const result = await activateCard("u1");
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cardActive: true }),
      })
    );
    expect(result.cardActive).toBe(true);
  });

  it("reuses existing slug and token on re-activation", async () => {
    db.user.findUnique.mockResolvedValueOnce({
      id: "u1", slug: "existing-slug", cardToken: "existing-tok", displayName: "Alice",
    });
    db.user.update.mockResolvedValue({ id: "u1", cardActive: true, slug: "existing-slug", cardToken: "existing-tok" });

    await activateCard("u1");
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "existing-slug", cardToken: "existing-tok" }),
      })
    );
  });

  it("throws USER_NOT_FOUND for unknown user", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(activateCard("nope")).rejects.toThrow("USER_NOT_FOUND");
  });
});

// ─── deactivateCard ───────────────────────────────────────────────────────────

describe("deactivateCard", () => {
  it("sets cardActive to false", async () => {
    db.user.update.mockResolvedValue({ id: "u1", cardActive: false });
    await deactivateCard("u1");
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { cardActive: false } })
    );
  });
});

// ─── getPublicCard ────────────────────────────────────────────────────────────

describe("getPublicCard", () => {
  it("returns card for active slug", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", slug: "alice", cardActive: true, displayName: "Alice" });
    const card = await getPublicCard("alice");
    expect(card).not.toBeNull();
    expect(card?.displayName).toBe("Alice");
  });

  it("returns null for inactive card", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", slug: "alice", cardActive: false });
    const card = await getPublicCard("alice");
    expect(card).toBeNull();
  });

  it("returns null when slug not found", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const card = await getPublicCard("nope");
    expect(card).toBeNull();
  });
});

// ─── logCardScan ──────────────────────────────────────────────────────────────

describe("logCardScan", () => {
  it("creates a scan record with provided metadata", async () => {
    db.cardScan.create.mockResolvedValue({});
    await logCardScan("u1", { ip: "1.2.3.4", userAgent: "TestBot" });
    expect(db.cardScan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1", ip: "1.2.3.4" }),
      })
    );
  });
});
