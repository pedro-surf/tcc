-- AlterTable Spot
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "strongSwellTolerance" INTEGER;
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "strongWindTolerance" INTEGER;
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- Normalize secret to non-null boolean
UPDATE "Spot" SET "secret" = false WHERE "secret" IS NULL;
ALTER TABLE "Spot" ALTER COLUMN "secret" SET DEFAULT false;
ALTER TABLE "Spot" ALTER COLUMN "secret" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Spot_createdById_fkey'
  ) THEN
    ALTER TABLE "Spot"
      ADD CONSTRAINT "Spot_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable SpotMedia
CREATE TABLE IF NOT EXISTS "SpotMedia" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotMedia_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SpotMedia_spotId_fkey'
  ) THEN
    ALTER TABLE "SpotMedia"
      ADD CONSTRAINT "SpotMedia_spotId_fkey"
      FOREIGN KEY ("spotId") REFERENCES "Spot"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
