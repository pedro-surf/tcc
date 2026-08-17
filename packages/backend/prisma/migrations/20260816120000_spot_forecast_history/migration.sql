-- CreateEnum
CREATE TYPE "ForecastSource" AS ENUM ('COPERNICUS_MARINE', 'WORLD_WEATHER_ONLINE');

-- CreateEnum
CREATE TYPE "ForecastFetchKind" AS ENUM ('FORECAST', 'HISTORY');

-- CreateTable
CREATE TABLE "SpotForecastFetch" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "source" "ForecastSource" NOT NULL,
    "kind" "ForecastFetchKind" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "datasetId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "requestedById" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotForecastFetch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "SpotForecast" ADD COLUMN "source" "ForecastSource",
ADD COLUMN "fetchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SpotForecastFetch_spotId_source_year_month_kind_key" ON "SpotForecastFetch"("spotId", "source", "year", "month", "kind");

-- CreateIndex
CREATE INDEX "SpotForecastFetch_spotId_year_month_idx" ON "SpotForecastFetch"("spotId", "year", "month");

-- CreateIndex
CREATE INDEX "SpotForecast_spotId_timestamp_idx" ON "SpotForecast"("spotId", "timestamp");

-- AddForeignKey
ALTER TABLE "SpotForecastFetch" ADD CONSTRAINT "SpotForecastFetch_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotForecastFetch" ADD CONSTRAINT "SpotForecastFetch_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotForecast" ADD CONSTRAINT "SpotForecast_fetchId_fkey" FOREIGN KEY ("fetchId") REFERENCES "SpotForecastFetch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
