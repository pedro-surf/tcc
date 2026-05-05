/*
  Warnings:

  - You are about to drop the column `location` on the `Spot` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `Spot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SpotForecast" DROP CONSTRAINT "SpotForecast_spotId_fkey";

-- AlterTable
ALTER TABLE "Spot" DROP COLUMN "location",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SpotForecast" ADD COLUMN     "locationId" TEXT,
ALTER COLUMN "spotId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" "Country" NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotForecast" ADD CONSTRAINT "SpotForecast_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotForecast" ADD CONSTRAINT "SpotForecast_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
