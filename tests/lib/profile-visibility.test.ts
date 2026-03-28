import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));

import { db } from "@/lib/db";
import { getPublicCard, DEFAULT_VISIBILITY } from "@/lib/profile/profile";

const mdb = db as any;

const baseUser = {
  id: "user-1",
  slug: "test-user",
  displayName: "Test User",
  bio: "Hello world",
  photoUrl: "https://example.com/photo.jpg",
  location: "NYC",
  links: [{ label: "Site", url: "https://example.com" }],
  cardActive: true,
  cardToken: "tok-123",
  fieldVisibility: null,
};

describe("getPublicCard — field visibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all default-visible fields when fieldVisibility is null", async () => {
    mdb.user.findUnique.mockResolvedValue(baseUser);

    const card = await getPublicCard("test-user");

    expect(card).not.toBeNull();
    expect(card!.displayName).toBe("Test User");
    expect(card!.bio).toBe("Hello world");
    expect(card!.location).toBe("NYC");
    // photoUrl and links are hidden by default
    expect(card!.photoUrl).toBeNull();
    expect(card!.links).toBeNull();
  });

  it("respects custom visibility — all fields public", async () => {
    mdb.user.findUnique.mockResolvedValue({
      ...baseUser,
      fieldVisibility: { displayName: true, bio: true, location: true, photoUrl: true, links: true },
    });

    const card = await getPublicCard("test-user");

    expect(card!.displayName).toBe("Test User");
    expect(card!.photoUrl).toBe("https://example.com/photo.jpg");
    expect(card!.links).toEqual([{ label: "Site", url: "https://example.com" }]);
  });

  it("respects custom visibility — all fields hidden", async () => {
    mdb.user.findUnique.mockResolvedValue({
      ...baseUser,
      fieldVisibility: { displayName: false, bio: false, location: false, photoUrl: false, links: false },
    });

    const card = await getPublicCard("test-user");

    expect(card!.displayName).toBeNull();
    expect(card!.bio).toBeNull();
    expect(card!.location).toBeNull();
    expect(card!.photoUrl).toBeNull();
    expect(card!.links).toBeNull();
  });

  it("merges partial visibility with defaults", async () => {
    mdb.user.findUnique.mockResolvedValue({
      ...baseUser,
      fieldVisibility: { photoUrl: true },
    });

    const card = await getPublicCard("test-user");

    // photoUrl overridden to true
    expect(card!.photoUrl).toBe("https://example.com/photo.jpg");
    // defaults still apply
    expect(card!.displayName).toBe("Test User");
    expect(card!.links).toBeNull();
  });

  it("returns null for inactive card", async () => {
    mdb.user.findUnique.mockResolvedValue({ ...baseUser, cardActive: false });
    expect(await getPublicCard("test-user")).toBeNull();
  });

  it("returns null for non-existent slug", async () => {
    mdb.user.findUnique.mockResolvedValue(null);
    expect(await getPublicCard("no-such-user")).toBeNull();
  });

  it("exports correct DEFAULT_VISIBILITY", () => {
    expect(DEFAULT_VISIBILITY).toEqual({
      displayName: true,
      bio: true,
      location: true,
      photoUrl: false,
      links: false,
    });
  });
});
