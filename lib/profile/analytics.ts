import { db } from "@/lib/db";

export interface AnalyticsData {
  scanCount: number;
  pendingCount: number;
  approvedCount: number;
  activeConnectionCount: number;
}

export async function getAnalytics(userId: string): Promise<AnalyticsData> {
  const [scanCount, pendingCount, approvedCount, activeConnectionCount] = await Promise.all([
    db.cardScan.count({ where: { userId } }),
    db.connectionRequest.count({ where: { ownerId: userId, status: "PENDING" } }),
    db.connectionRequest.count({ where: { ownerId: userId, status: "APPROVED" } }),
    db.connectionRequest.count({
      where: {
        OR: [{ ownerId: userId }, { prospectId: userId }],
        status: { in: ["APPROVED", "WALI_APPROVED"] },
      },
    }),
  ]);
  return { scanCount, pendingCount, approvedCount, activeConnectionCount };
}
