/*
  Warnings:

  - You are about to drop the column `type` on the `Spot` table. All the data in the column will be lost.
  - Added the required column `bottomType` to the `Spot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `waveType` to the `Spot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WaveType" AS ENUM ('BEACHIE', 'LEFT_POINT', 'RIGHT_POINT', 'A_FRAME', 'SLAB');

-- CreateEnum
CREATE TYPE "BottomType" AS ENUM ('SAND', 'ROCK', 'REEF');

-- AlterTable
ALTER TABLE "Spot" DROP COLUMN "type",
ADD COLUMN     "bottomType" "BottomType" NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "waveType" "WaveType" NOT NULL;
