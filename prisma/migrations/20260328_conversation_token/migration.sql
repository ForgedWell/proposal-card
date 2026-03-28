-- AlterTable
ALTER TABLE "connection_requests" ADD COLUMN     "conversationToken" TEXT,
ADD COLUMN     "sentCountOwner" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentCountRequester" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "connection_requests_conversationToken_key" ON "connection_requests"("conversationToken");
