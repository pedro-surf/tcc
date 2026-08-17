-- CreateEnum
CREATE TYPE "HeatStatus" AS ENUM ('PENDING', 'RUNNING', 'FINISHED');

-- CreateTable
CREATE TABLE "CompetitionHeat" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "judgeCount" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "status" "HeatStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionHeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatSurfer" (
    "id" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatSurfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatWave" (
    "id" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "surferId" TEXT NOT NULL,
    "elapsedSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatWave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatWaveScore" (
    "id" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "judgeIndex" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatWaveScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitionHeat_competitionId_createdAt_idx" ON "CompetitionHeat"("competitionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HeatSurfer_heatId_userId_key" ON "HeatSurfer"("heatId", "userId");

-- CreateIndex
CREATE INDEX "HeatWave_heatId_elapsedSec_idx" ON "HeatWave"("heatId", "elapsedSec");

-- CreateIndex
CREATE UNIQUE INDEX "HeatWaveScore_waveId_judgeIndex_key" ON "HeatWaveScore"("waveId", "judgeIndex");

-- AddForeignKey
ALTER TABLE "CompetitionHeat" ADD CONSTRAINT "CompetitionHeat_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SpotCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatSurfer" ADD CONSTRAINT "HeatSurfer_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "CompetitionHeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatSurfer" ADD CONSTRAINT "HeatSurfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatWave" ADD CONSTRAINT "HeatWave_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "CompetitionHeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatWave" ADD CONSTRAINT "HeatWave_surferId_fkey" FOREIGN KEY ("surferId") REFERENCES "HeatSurfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatWaveScore" ADD CONSTRAINT "HeatWaveScore_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "HeatWave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
