-- CreateTable Brand
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name");

-- Backfill brands from legacy string columns
INSERT INTO "Brand" ("id", "name", "createdAt")
SELECT gen_random_uuid()::text, b.brand, NOW()
FROM (
  SELECT DISTINCT TRIM("brand") AS brand FROM "Board" WHERE "brand" IS NOT NULL AND TRIM("brand") <> ''
  UNION
  SELECT DISTINCT TRIM("brand") FROM "Wetsuit" WHERE "brand" IS NOT NULL AND TRIM("brand") <> ''
  UNION
  SELECT DISTINCT TRIM("brand") FROM "Fins" WHERE "brand" IS NOT NULL AND TRIM("brand") <> ''
  UNION
  SELECT DISTINCT TRIM("brand") FROM "Leash" WHERE "brand" IS NOT NULL AND TRIM("brand") <> ''
) b
WHERE NOT EXISTS (
  SELECT 1 FROM "Brand" existing WHERE existing."name" = b.brand
);

-- Board: brandId, drop owner/brand string
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
UPDATE "Board" b
SET "brandId" = br."id"
FROM "Brand" br
WHERE b."brand" IS NOT NULL AND TRIM(b."brand") = br."name";

ALTER TABLE "Board" DROP CONSTRAINT IF EXISTS "Board_ownerId_fkey";
ALTER TABLE "Board" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Board" DROP COLUMN IF EXISTS "brand";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Board_brandId_fkey') THEN
    ALTER TABLE "Board"
      ADD CONSTRAINT "Board_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Wetsuit
ALTER TABLE "Wetsuit" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
UPDATE "Wetsuit" w
SET "brandId" = br."id"
FROM "Brand" br
WHERE w."brand" IS NOT NULL AND TRIM(w."brand") = br."name";

ALTER TABLE "Wetsuit" DROP CONSTRAINT IF EXISTS "Wetsuit_ownerId_fkey";
ALTER TABLE "Wetsuit" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Wetsuit" DROP COLUMN IF EXISTS "brand";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wetsuit_brandId_fkey') THEN
    ALTER TABLE "Wetsuit"
      ADD CONSTRAINT "Wetsuit_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Fins
ALTER TABLE "Fins" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
UPDATE "Fins" f
SET "brandId" = br."id"
FROM "Brand" br
WHERE f."brand" IS NOT NULL AND TRIM(f."brand") = br."name";

ALTER TABLE "Fins" DROP CONSTRAINT IF EXISTS "Fins_ownerId_fkey";
ALTER TABLE "Fins" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Fins" DROP COLUMN IF EXISTS "brand";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Fins_brandId_fkey') THEN
    ALTER TABLE "Fins"
      ADD CONSTRAINT "Fins_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Leash
ALTER TABLE "Leash" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
UPDATE "Leash" l
SET "brandId" = br."id"
FROM "Brand" br
WHERE l."brand" IS NOT NULL AND TRIM(l."brand") = br."name";

ALTER TABLE "Leash" DROP CONSTRAINT IF EXISTS "Leash_ownerId_fkey";
ALTER TABLE "Leash" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Leash" DROP COLUMN IF EXISTS "brand";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Leash_brandId_fkey') THEN
    ALTER TABLE "Leash"
      ADD CONSTRAINT "Leash_brandId_fkey"
      FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Offer buyer / conclusion
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "buyerId" TEXT;
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "concludedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_buyerId_fkey') THEN
    ALTER TABLE "Offer"
      ADD CONSTRAINT "Offer_buyerId_fkey"
      FOREIGN KEY ("buyerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Rename Offer.user relation constraint stays Offer_userId_fkey (seller)

-- UserGear
CREATE TABLE IF NOT EXISTS "UserGear" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productType" "MarketplaceProductType" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "fromUserId" TEXT,
    "offerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGear_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserGear_productType_productId_acquiredAt_idx"
  ON "UserGear"("productType", "productId", "acquiredAt");
CREATE INDEX IF NOT EXISTS "UserGear_userId_releasedAt_idx"
  ON "UserGear"("userId", "releasedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserGear_userId_fkey') THEN
    ALTER TABLE "UserGear"
      ADD CONSTRAINT "UserGear_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserGear_fromUserId_fkey') THEN
    ALTER TABLE "UserGear"
      ADD CONSTRAINT "UserGear_fromUserId_fkey"
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserGear_offerId_fkey') THEN
    ALTER TABLE "UserGear"
      ADD CONSTRAINT "UserGear_offerId_fkey"
      FOREIGN KEY ("offerId") REFERENCES "Offer"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed current ownership from active offers (seller holds gear until concluded)
INSERT INTO "UserGear" ("id", "userId", "productId", "productType", "acquiredAt", "releasedAt", "fromUserId", "offerId", "createdAt")
SELECT
  gen_random_uuid()::text,
  o."userId",
  o."productId",
  o."productType",
  o."createdAt",
  NULL,
  NULL,
  NULL,
  NOW()
FROM "Offer" o
WHERE o."active" = true
  AND NOT EXISTS (
    SELECT 1 FROM "UserGear" ug
    WHERE ug."productId" = o."productId"
      AND ug."productType" = o."productType"
      AND ug."releasedAt" IS NULL
  );
