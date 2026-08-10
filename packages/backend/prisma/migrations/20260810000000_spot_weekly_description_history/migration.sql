-- CreateTable
CREATE TABLE IF NOT EXISTS "SpotWeeklyDescription" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "primaryForecastId" TEXT,
    CONSTRAINT "SpotWeeklyDescription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SpotWeeklyDescription_spotId_generatedAt_idx"
  ON "SpotWeeklyDescription"("spotId", "generatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SpotWeeklyDescription_spotId_fkey'
  ) THEN
    ALTER TABLE "SpotWeeklyDescription"
      ADD CONSTRAINT "SpotWeeklyDescription_spotId_fkey"
      FOREIGN KEY ("spotId") REFERENCES "Spot"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SpotWeeklyDescription_primaryForecastId_fkey'
  ) THEN
    ALTER TABLE "SpotWeeklyDescription"
      ADD CONSTRAINT "SpotWeeklyDescription_primaryForecastId_fkey"
      FOREIGN KEY ("primaryForecastId") REFERENCES "SpotForecast"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill current cached weekly descriptions into history
INSERT INTO "SpotWeeklyDescription" ("id", "spotId", "description", "generatedAt", "weekStart", "primaryForecastId")
SELECT
  gen_random_uuid()::text,
  s."id",
  s."weeklyGeneratedDescription",
  COALESCE(s."weeklyGeneratedAt", NOW()),
  date_trunc('week', COALESCE(s."weeklyGeneratedAt", NOW()) AT TIME ZONE 'UTC'),
  NULL
FROM "Spot" s
WHERE s."weeklyGeneratedDescription" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "SpotWeeklyDescription" h
    WHERE h."spotId" = s."id"
      AND h."description" = s."weeklyGeneratedDescription"
      AND h."generatedAt" = COALESCE(s."weeklyGeneratedAt", h."generatedAt")
  );
