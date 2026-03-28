import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));

import { db } from "@/lib/db";
import { getAnalytics } from "@/lib/profile/analytics";

const mdb = db as any;

describe("getAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all four counts", async () => {
    mdb.cardScan.count.mockResolvedValue(42);
    mdb.connectionRequest.count
      .mockResolvedValueOnce(5)   // pending
      .mockResolvedValueOnce(12); // approved
    mdb.proxyConnection.count.mockResolvedValue(3);

    const result = await getAnalytics("user-1");

    expect(result).toEqual({
      scanCount: 42,
      pendingCount: 5,
      approvedCount: 12,
      activeProxyCount: 3,
    });
  });

  it("returns zeros when no data", async () => {
    mdb.cardScan.count.mockResolvedValue(0);
    mdb.connectionRequest.count.mockResolvedValue(0);
    mdb.proxyConnection.count.mockResolvedValue(0);

    const result = await getAnalytics("user-2");

    expect(result.scanCount).toBe(0);
    expect(result.pendingCount).toBe(0);
    expect(result.approvedCount).toBe(0);
    expect(result.activeProxyCount).toBe(0);
  });

  it("queries with correct filters", async () => {
    mdb.cardScan.count.mockResolvedValue(0);
    mdb.connectionRequest.count.mockResolvedValue(0);
    mdb.proxyConnection.count.mockResolvedValue(0);

    await getAnalytics("user-1");

    expect(mdb.cardScan.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mdb.connectionRequest.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "user-1", status: "PENDING" } })
    );
    expect(mdb.connectionRequest.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "user-1", status: "APPROVED" } })
    );
    expect(mdb.proxyConnection.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "user-1", closedAt: null, expiresAt: expect.any(Object) },
      })
    );
  });
});
