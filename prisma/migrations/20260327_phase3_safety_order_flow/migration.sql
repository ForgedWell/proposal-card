-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fieldVisibility" JSONB;

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "connectionRequestId" TEXT,
    "contact" TEXT,
    "category" "ReportCategory" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_attempts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ip" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_ownerId_contact_key" ON "blocks"("ownerId", "contact");

-- CreateIndex
CREATE INDEX "contact_attempts_ownerId_ip_createdAt_idx" ON "contact_attempts"("ownerId", "ip", "createdAt");

-- CreateIndex
CREATE INDEX "contact_attempts_ownerId_contact_createdAt_idx" ON "contact_attempts"("ownerId", "contact", "createdAt");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
