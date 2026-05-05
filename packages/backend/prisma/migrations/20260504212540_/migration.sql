/*
  Warnings:

  - You are about to drop the column `conditions` on the `SpotCheck` table. All the data in the column will be lost.
  - Added the required column `description` to the `SpotCheck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotCheck" DROP COLUMN "conditions",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SpotForecast" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "ideal" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "swell" DOUBLE PRECISION NOT NULL,
    "swellDir" DOUBLE PRECISION NOT NULL,
    "wind" DOUBLE PRECISION NOT NULL,
    "windDir" DOUBLE PRECISION NOT NULL,
    "period" DOUBLE PRECISION,
    "energy" DOUBLE PRECISION,
    "temp" DOUBLE PRECISION,
    "gust" TEXT,
    "power" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotForecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotForecast_spotId_userId_timestamp_key" ON "SpotForecast"("spotId", "userId", "timestamp");

-- AddForeignKey
ALTER TABLE "SpotForecast" ADD CONSTRAINT "SpotForecast_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotForecast" ADD CONSTRAINT "SpotForecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
