-- AlterTable: add pipeline stage tracking fields to School
ALTER TABLE "School" ADD COLUMN "currentPipelineStage" TEXT;
ALTER TABLE "School" ADD COLUMN "stageEnteredAt" TIMESTAMP(3);
ALTER TABLE "School" ADD COLUMN "previousStage" TEXT;

-- CreateIndex
CREATE INDEX "School_currentPipelineStage_idx" ON "School"("currentPipelineStage");
