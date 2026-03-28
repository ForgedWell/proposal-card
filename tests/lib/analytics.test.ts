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
      .mockResolvedValueOnce(12)  // approved
      .mockResolvedValueOnce(15); // active connections

    const result = await getAnalytics("user-1");

    expect(result).toEqual({
      scanCount: 42,
      pendingCount: 5,
      approvedCount: 12,
      activeConnectionCount: 15,
    });
  });

  it("returns zeros when no data", async () => {
    mdb.cardScan.count.mockResolvedValue(0);
    mdb.connectionRequest.count.mockResolvedValue(0);

    const result = await getAnalytics("user-2");

    expect(result.scanCount).toBe(0);
    expect(result.pendingCount).toBe(0);
    expect(result.approvedCount).toBe(0);
    expect(result.activeConnectionCount).toBe(0);
  });

  it("queries with correct filters", async () => {
    mdb.cardScan.count.mockResolvedValue(0);
    mdb.connectionRequest.count.mockResolvedValue(0);

    await getAnalytics("user-1");

    expect(mdb.cardScan.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mdb.connectionRequest.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "user-1", status: "PENDING" } })
    );
  });
});
