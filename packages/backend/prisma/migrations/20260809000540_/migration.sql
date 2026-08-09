/*
  Warnings:

  - Added the required column `score` to the `SpotCheck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotCheck" ADD COLUMN     "score" DOUBLE PRECISION NOT NULL;
