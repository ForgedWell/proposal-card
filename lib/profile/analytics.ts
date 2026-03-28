import { db } from "@/lib/db";

export interface AnalyticsData {
  scanCount: number;
  pendingCount: number;
  approvedCount: number;
  activeProxyCount: number;
}

export async function getAnalytics(userId: string): Promise<AnalyticsData> {
  const now = new Date();
  const [scanCount, pendingCount, approvedCount, activeProxyCount] = await Promise.all([
    db.cardScan.count({ where: { userId } }),
    db.connectionRequest.count({ where: { ownerId: userId, status: "PENDING" } }),
    db.connectionRequest.count({ where: { ownerId: userId, status: "APPROVED" } }),
    db.proxyConnection.count({
      where: { ownerId: userId, closedAt: null, expiresAt: { gt: now } },
    }),
  ]);
  return { scanCount, pendingCount, approvedCount, activeProxyCount };
}
