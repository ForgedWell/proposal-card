import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));

import { db } from "@/lib/db";
import { blockContact, unblockContact, getBlockedContacts, isBlocked } from "@/lib/safety/block";

const mdb = db as any;

describe("block", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("blockContact", () => {
    it("creates a block and auto-declines pending requests", async () => {
      mdb.connectionRequest.updateMany.mockResolvedValue({ count: 1 });
      mdb.block.create.mockResolvedValue({ id: "b1", ownerId: "u1", contact: "bad@test.com" });

      const result = await blockContact("u1", "Bad@Test.com", "spam");

      expect(mdb.connectionRequest.updateMany).toHaveBeenCalledWith({
        where: { ownerId: "u1", prospectContact: "Bad@Test.com", status: "PENDING" },
        data: { status: "DECLINED", decidedAt: expect.any(Date) },
      });
      expect(mdb.block.create).toHaveBeenCalledWith({
        data: { ownerId: "u1", contact: "bad@test.com", reason: "spam" },
      });
      expect(result.id).toBe("b1");
    });

    it("lowercases the contact for storage", async () => {
      mdb.connectionRequest.updateMany.mockResolvedValue({ count: 0 });
      mdb.block.create.mockResolvedValue({ id: "b2" });

      await blockContact("u1", "UPPER@CASE.COM");

      expect(mdb.block.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ contact: "upper@case.com" }) })
      );
    });
  });

  describe("unblockContact", () => {
    it("deletes block by composite key", async () => {
      mdb.block.delete.mockResolvedValue({ id: "b1" });

      await unblockContact("u1", "Test@Email.com");

      expect(mdb.block.delete).toHaveBeenCalledWith({
        where: { ownerId_contact: { ownerId: "u1", contact: "test@email.com" } },
      });
    });
  });

  describe("getBlockedContacts", () => {
    it("returns blocks ordered by createdAt desc", async () => {
      mdb.block.findMany.mockResolvedValue([{ id: "b1" }, { id: "b2" }]);

      const result = await getBlockedContacts("u1");

      expect(mdb.block.findMany).toHaveBeenCalledWith({
        where: { ownerId: "u1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("isBlocked", () => {
    it("returns true when block exists", async () => {
      mdb.block.findFirst.mockResolvedValue({ id: "b1" });
      expect(await isBlocked("u1", "Bad@Test.com")).toBe(true);
      expect(mdb.block.findFirst).toHaveBeenCalledWith({
        where: { ownerId: "u1", contact: "bad@test.com" },
      });
    });

    it("returns false when no block", async () => {
      mdb.block.findFirst.mockResolvedValue(null);
      expect(await isBlocked("u1", "ok@test.com")).toBe(false);
    });
  });
});
