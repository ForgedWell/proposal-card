-- CreateEnum
CREATE TYPE "CardTemplate" AS ENUM ('CLASSIC', 'MINIMAL', 'ELEGANT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cardColor" TEXT,
ADD COLUMN     "cardTemplate" "CardTemplate" NOT NULL DEFAULT 'CLASSIC';
