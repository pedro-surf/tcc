-- AlterTable Spot
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "idealWindDir" DOUBLE PRECISION;
ALTER TABLE "Spot" ADD COLUMN IF NOT EXISTS "idealSwellDir" DOUBLE PRECISION;

-- AlterTable SpotCompetition
ALTER TABLE "SpotCompetition" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "SpotCompetition" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SpotCompetition_createdById_fkey'
  ) THEN
    ALTER TABLE "SpotCompetition"
      ADD CONSTRAINT "SpotCompetition_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
