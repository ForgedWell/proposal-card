import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));

import { sendMessage, getThread, getApprovedConnections } from "@/lib/connect/messages";
import { ConnectionStatus } from "@prisma/client";

beforeEach(() => vi.clearAllMocks());

const approvedConnection = {
  id: "conn-1",
  ownerId: "owner-1",
  prospectId: "prospect-1",
  status: ConnectionStatus.APPROVED,
};

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe("sendMessage", () => {
  it("creates a message on an approved connection", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(approvedConnection);
    db.message.create.mockResolvedValue({ id: "msg-1", body: "Hello" });

    await sendMessage({
      connectionRequestId: "conn-1",
      senderId:    "owner-1",
      recipientId: "prospect-1",
      body:        "Hello",
    });

    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ body: "Hello", senderId: "owner-1" }),
      })
    );
  });

  it("throws CONNECTION_NOT_FOUND for unknown connection", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(null);
    await expect(
      sendMessage({ connectionRequestId: "nope", senderId: "u1", recipientId: "u2", body: "Hi" })
    ).rejects.toThrow("CONNECTION_NOT_FOUND");
  });

  it("throws CONNECTION_NOT_APPROVED for pending connection", async () => {
    db.connectionRequest.findUnique.mockResolvedValue({ ...approvedConnection, status: ConnectionStatus.PENDING });
    await expect(
      sendMessage({ connectionRequestId: "conn-1", senderId: "owner-1", recipientId: "prospect-1", body: "Hi" })
    ).rejects.toThrow("CONNECTION_NOT_APPROVED");
  });

  it("throws NOT_A_PARTY when sender is not owner or prospect", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(approvedConnection);
    await expect(
      sendMessage({ connectionRequestId: "conn-1", senderId: "intruder", recipientId: "owner-1", body: "Hi" })
    ).rejects.toThrow("NOT_A_PARTY");
  });
});

// ─── getThread ────────────────────────────────────────────────────────────────

describe("getThread", () => {
  it("fetches messages and marks unread as read", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(approvedConnection);
    db.message.updateMany.mockResolvedValue({ count: 1 });
    db.message.findMany.mockResolvedValue([{ id: "msg-1", body: "Hi" }]);

    const messages = await getThread("conn-1", "owner-1");

    expect(db.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipientId: "owner-1", readAt: null }),
        data:  expect.objectContaining({ readAt: expect.any(Date) }),
      })
    );
    expect(messages).toHaveLength(1);
  });

  it("throws FORBIDDEN when user is not a party", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(approvedConnection);
    await expect(getThread("conn-1", "intruder")).rejects.toThrow("FORBIDDEN");
  });

  it("throws CONNECTION_NOT_FOUND for unknown connection", async () => {
    db.connectionRequest.findUnique.mockResolvedValue(null);
    await expect(getThread("nope", "owner-1")).rejects.toThrow("CONNECTION_NOT_FOUND");
  });
});

// ─── getApprovedConnections ───────────────────────────────────────────────────

describe("getApprovedConnections", () => {
  it("queries approved connections where user is owner or prospect", async () => {
    db.connectionRequest.findMany.mockResolvedValue([]);
    await getApprovedConnections("user-1");
    expect(db.connectionRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ["APPROVED", "WALI_APPROVED"] },
          OR: [{ ownerId: "user-1" }, { prospectId: "user-1" }],
        },
      })
    );
  });
});
