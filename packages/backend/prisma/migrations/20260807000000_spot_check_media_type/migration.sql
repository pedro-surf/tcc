-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "SpotCheckMedia" ADD COLUMN "mediaType" "MediaType",
ADD COLUMN "mimeType" TEXT;

-- Backfill existing rows (if any) as IMAGE, then enforce NOT NULL
UPDATE "SpotCheckMedia" SET "mediaType" = 'IMAGE' WHERE "mediaType" IS NULL;

ALTER TABLE "SpotCheckMedia" ALTER COLUMN "mediaType" SET NOT NULL;
