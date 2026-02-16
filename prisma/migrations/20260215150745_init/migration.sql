-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "totalSchools" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Region_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "type" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactPerson" TEXT,
    "activeCampaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uncontacted',
    "notes" TEXT,
    "pipelineStageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "School_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "School_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "acGroupId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "acStageId" INTEGER NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contactsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_name_key" ON "Market"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Region_marketId_name_key" ON "Region"("marketId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "School_activeCampaignId_key" ON "School"("activeCampaignId");

-- CreateIndex
CREATE INDEX "School_regionId_idx" ON "School"("regionId");

-- CreateIndex
CREATE INDEX "School_status_idx" ON "School"("status");

-- CreateIndex
CREATE INDEX "School_activeCampaignId_idx" ON "School"("activeCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_name_key" ON "Pipeline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_acGroupId_key" ON "Pipeline"("acGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_acStageId_key" ON "PipelineStage"("acStageId");

-- CreateIndex
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");
