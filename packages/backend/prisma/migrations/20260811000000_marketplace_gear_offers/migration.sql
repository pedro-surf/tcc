-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MarketplaceProductType" AS ENUM ('BOARD', 'WETSUIT', 'FINS', 'LEASH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Currency" AS ENUM ('BRL', 'USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- AlterTable Board
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Board_ownerId_fkey'
  ) THEN
    ALTER TABLE "Board"
      ADD CONSTRAINT "Board_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable Wetsuit
ALTER TABLE "Wetsuit" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "Wetsuit" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "Wetsuit" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wetsuit_ownerId_fkey'
  ) THEN
    ALTER TABLE "Wetsuit"
      ADD CONSTRAINT "Wetsuit_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable Fins
CREATE TABLE IF NOT EXISTS "Fins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "size" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fins_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Fins_ownerId_fkey'
  ) THEN
    ALTER TABLE "Fins"
      ADD CONSTRAINT "Fins_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable Leash
CREATE TABLE IF NOT EXISTS "Leash" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "length" DOUBLE PRECISION,
    "thickness" DOUBLE PRECISION,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leash_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Leash_ownerId_fkey'
  ) THEN
    ALTER TABLE "Leash"
      ADD CONSTRAINT "Leash_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable Offer
CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productType" "MarketplaceProductType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "title" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Offer_productType_active_idx" ON "Offer"("productType", "active");
CREATE INDEX IF NOT EXISTS "Offer_userId_createdAt_idx" ON "Offer"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Offer_userId_fkey'
  ) THEN
    ALTER TABLE "Offer"
      ADD CONSTRAINT "Offer_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
