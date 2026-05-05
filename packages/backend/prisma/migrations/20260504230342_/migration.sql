/*
  Warnings:

  - Added the required column `country` to the `Spot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Country" AS ENUM ('BRAZIL', 'AUSTRALIA', 'PORTUGAL', 'CHILE', 'PERU');

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN     "country" "Country" NOT NULL,
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "secret" DROP NOT NULL;
