import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/tests/__mocks__/db";

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/email/resend", () => ({
  sendOtpEmail: vi.fn(),
  sendEmail:    vi.fn().mockResolvedValue(undefined),
}));

import { createConnectionRequest, approveRequest, declineRequest, getPendingRequests } from "@/lib/connect/requests";
import { ConnectionStatus } from "@prisma/client";

beforeEach(() => vi.clearAllMocks());

const mockOwner = {
  id: "owner-1",
  email: "owner@example.com",
  displayName: "Alice",
  waliActive: false,
  waliEmail: null,
  waliPhone: null,
};

// ─── createConnectionRequest ──────────────────────────────────────────────────

describe("createConnectionRequest", () => {
  it("creates a pending request and notifies owner by email", async () => {
    db.user.findUnique.mockResolvedValue(mockOwner);
    db.connectionRequest.create.mockResolvedValue({ id: "req-1", status: "PENDING" });

    const { sendEmail } = await import("@/lib/email/resend");
    const result = await createConnectionRequest({
      ownerId: "owner-1",
      prospectName: "Bob",
      prospectContact: "bob@example.com",
      intent: "Would love to connect",
    });

    expect(db.connectionRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: "owner-1", status: ConnectionStatus.PENDING }),
      })
    );
    expect(sendEmail).toHaveBeenCalledWith(
      "owner@example.com",
      expect.stringContaining("connection request"),
      expect.stringContaining("Bob")
    );
    expect(result.id).toBe("req-1");
  });

  it("also notifies Wali when waliActive is true", async () => {
    db.user.findUnique.mockResolvedValue({
      ...mockOwner,
      waliActive: true,
      waliEmail: "guardian@example.com",
    });
    db.connectionRequest.create.mockResolvedValue({ id: "req-2", status: "PENDING" });

    const { sendEmail } = await import("@/lib/email/resend");
    await createConnectionRequest({
      ownerId: "owner-1",
      prospectName: "Carol",
      prospectContact: "carol@example.com",
      intent: "Interested in your work",
    });

    // sendEmail called twice — once for owner, once for wali
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(sendEmail).mock.calls;
    expect(calls.some(c => c[0] === "guardian@example.com")).toBe(true);
  });

  it("throws OWNER_NOT_FOUND when owner doesn't exist", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(
      createConnectionRequest({ ownerId: "nope", prospectName: "X", prospectContact: "x@x.com", intent: "Hi" })
    ).rejects.toThrow("OWNER_NOT_FOUND");
  });
});

// ─── approveRequest ───────────────────────────────────────────────────────────

describe("approveRequest", () => {
  it("sets status to APPROVED and records decidedAt", async () => {
    db.connectionRequest.findUnique.mockResolvedValue({ id: "req-1", ownerId: "owner-1", status: "PENDING" });
    db.connectionRequest.update.mockResolvedValue({ id: "req-1", status: "APPROVED" });

    await approveRequest("req-1", "owner-1");

    expect(db.connectionRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ConnectionStatus.APPROVED }),
      })
    );
  });

  it("throws NOT_FOUND when request doesn't belong to owner", async () => {
    db.connectionRequest.findUnique.mockResolvedValue({ id: "req-1", ownerId: "other", status: "PENDING" });
    await expect(approveRequest("req-1", "owner-1")).rejects.toThrow("NOT_FOUND");
  });

  it("throws ALREADY_DECIDED when not pending", async () => {
    db.connectionRequest.findUnique.mockResolvedValue({ id: "req-1", ownerId: "owner-1", status: "APPROVED" });
    await expect(approveRequest("req-1", "owner-1")).rejects.toThrow("ALREADY_DECIDED");
  });
});

// ─── declineRequest ───────────────────────────────────────────────────────────

describe("declineRequest", () => {
  it("sets status to DECLINED", async () => {
    db.connectionRequest.findUnique.mockResolvedValue({ id: "req-1", ownerId: "owner-1", status: "PENDING" });
    db.connectionRequest.update.mockResolvedValue({ id: "req-1", status: "DECLINED" });

    await declineRequest("req-1", "owner-1");
    expect(db.connectionRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ConnectionStatus.DECLINED }),
      })
    );
  });
});

// ─── getPendingRequests ───────────────────────────────────────────────────────

describe("getPendingRequests", () => {
  it("queries only PENDING requests for the owner", async () => {
    db.connectionRequest.findMany.mockResolvedValue([]);
    await getPendingRequests("owner-1");
    expect(db.connectionRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "owner-1", status: ConnectionStatus.PENDING },
      })
    );
  });
});
