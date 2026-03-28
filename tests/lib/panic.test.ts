import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));
vi.mock("@/lib/email/resend", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { executePanic } from "@/lib/safety/panic";

const mdb = db as any;

describe("executePanic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deactivates card, closes connections, and sends email", async () => {
    mdb.user.update.mockResolvedValue({
      email: "user@test.com",
      displayName: "Test User",
    });
    mdb.connectionRequest.updateMany.mockResolvedValue({ count: 2 });

    await executePanic("user-1");

    expect(mdb.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { cardActive: false },
      select: { email: true, displayName: true },
    });

    expect(mdb.connectionRequest.updateMany).toHaveBeenCalledWith({
      where: { ownerId: "user-1", status: { in: ["APPROVED", "WALI_APPROVED"] } },
      data: { status: "CLOSED", closedAt: expect.any(Date) },
    });

    expect(sendEmail).toHaveBeenCalledWith(
      "user@test.com",
      "Proposal Card — Safety lockdown activated",
      expect.stringContaining("Safety Lockdown Activated")
    );
  });

  it("skips email when user has no email", async () => {
    mdb.user.update.mockResolvedValue({ email: null, displayName: null });
    mdb.connectionRequest.updateMany.mockResolvedValue({ count: 0 });

    await executePanic("user-2");

    expect(sendEmail).not.toHaveBeenCalled();
    expect(mdb.user.update).toHaveBeenCalled();
    expect(mdb.connectionRequest.updateMany).toHaveBeenCalled();
  });

  it("does not throw if email fails", async () => {
    mdb.user.update.mockResolvedValue({ email: "user@test.com", displayName: null });
    mdb.connectionRequest.updateMany.mockResolvedValue({ count: 0 });
    (sendEmail as any).mockRejectedValue(new Error("Email failed"));

    await expect(executePanic("user-3")).resolves.toBeUndefined();
  });
});
