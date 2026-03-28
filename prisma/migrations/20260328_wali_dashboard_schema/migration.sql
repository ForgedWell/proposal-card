-- AlterEnum
BEGIN;
CREATE TYPE "ConnectionStatus_new" AS ENUM ('PENDING', 'APPROVED', 'PAUSED', 'WALI_APPROVED', 'CLOSED', 'DECLINED', 'BLOCKED');
ALTER TABLE "connection_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "connection_requests" ALTER COLUMN "status" TYPE "ConnectionStatus_new" USING ("status"::text::"ConnectionStatus_new");
ALTER TYPE "ConnectionStatus" RENAME TO "ConnectionStatus_old";
ALTER TYPE "ConnectionStatus_new" RENAME TO "ConnectionStatus";
DROP TYPE "ConnectionStatus_old";
ALTER TABLE "connection_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "proxy_connections" DROP CONSTRAINT "proxy_connections_connectionRequestId_fkey";

-- DropForeignKey
ALTER TABLE "proxy_connections" DROP CONSTRAINT "proxy_connections_ownerId_fkey";

-- AlterTable
ALTER TABLE "connection_requests" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedBy" TEXT,
ADD COLUMN     "waliApprovedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "waliFor" TEXT[];

-- DropTable
DROP TABLE "proxy_connections";

-- CreateTable
CREATE TABLE "wali_notes" (
    "id" TEXT NOT NULL,
    "connectionRequestId" TEXT NOT NULL,
    "waliId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wali_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_alerts" (
    "id" TEXT NOT NULL,
    "waliId" TEXT NOT NULL,
    "connectionRequestId" TEXT,
    "alertType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_alerts_waliId_connectionRequestId_alertType_sentAt_idx" ON "sms_alerts"("waliId", "connectionRequestId", "alertType", "sentAt");

-- AddForeignKey
ALTER TABLE "wali_notes" ADD CONSTRAINT "wali_notes_connectionRequestId_fkey" FOREIGN KEY ("connectionRequestId") REFERENCES "connection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wali_notes" ADD CONSTRAINT "wali_notes_waliId_fkey" FOREIGN KEY ("waliId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

