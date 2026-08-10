-- AlterTable Spot
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "weeklyGeneratedDescription" TEXT;
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "weeklyGeneratedAt" TIMESTAMP(3);
