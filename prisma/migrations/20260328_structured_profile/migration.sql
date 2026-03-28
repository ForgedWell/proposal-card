-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "hasChildren" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "intention" TEXT,
ADD COLUMN     "languages" JSONB,
ADD COLUMN     "maritalHistory" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "religiosity" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "wantsChildren" TEXT;
