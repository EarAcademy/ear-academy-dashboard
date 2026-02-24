import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acClient } from "@/lib/activecampaign";

// Pipeline name keywords used to classify AC pipelines
const CUSTOMER_KEYWORDS = ["customer", "account management", "client"];
const COLD_KEYWORDS = ["cold", "disqualified", "lost", "dead"];

function classifyPipeline(name: string): "active" | "customer" | "cold" {
  const lower = name.toLowerCase();
  if (CUSTOMER_KEYWORDS.some((k) => lower.includes(k))) return "customer";
  if (COLD_KEYWORDS.some((k) => lower.includes(k))) return "cold";
  return "active";
}

export async function POST() {
  const syncLog = await prisma.syncLog.create({
    data: { syncType: "contacts", status: "running" },
  });

  try {
    let contactsSynced = 0;
    const errors: string[] = [];

    // Load all pipelines and stages for classification + mapping
    const pipelines = await prisma.pipeline.findMany({
      include: { stages: true },
    });

    // Map: acGroupId → pipeline type
    const pipelineTypeMap = new Map<number, "active" | "customer" | "cold">();
    // Map: acStageId → stage name
    const stageNameMap = new Map<number, string>();
    // Map: acStageId → db stage id (for legacy pipelineStageId field)
    const stageIdMap = new Map<number, string>();

    for (const pipeline of pipelines) {
      const type = classifyPipeline(pipeline.name);
      pipelineTypeMap.set(pipeline.acGroupId, type);
      for (const stage of pipeline.stages) {
        stageNameMap.set(stage.acStageId, stage.name);
        stageIdMap.set(stage.acStageId, stage.id);
      }
    }

    // Paginate through all AC contacts
    for await (const contacts of acClient.getAllContacts()) {
      for (const contact of contacts) {
        try {
          // Find existing school by AC ID or email
          const school = await prisma.school.findFirst({
            where: {
              OR: [
                { activeCampaignId: contact.id },
                ...(contact.email ? [{ email: contact.email }] : []),
              ],
            },
          });

          if (!school) continue; // Skip contacts with no matching school

          // Always update activeCampaignId and phone if missing
          const baseUpdate: Record<string, unknown> = {
            activeCampaignId: contact.id,
            ...(contact.phone && !school.phone ? { phone: contact.phone } : {}),
          };

          // Fetch deals for this contact
          let dealUpdate: Record<string, unknown> = {};
          try {
            const dealData = await acClient.getContactDeals(contact.id);
            if (dealData.deals && dealData.deals.length > 0) {
              // Sort deals by modified date descending — use most recent
              const sorted = [...dealData.deals].sort(
                (a, b) => new Date(b.mdate).getTime() - new Date(a.mdate).getTime()
              );
              const latestDeal = sorted[0];
              const acGroupId = parseInt(latestDeal.group);
              const acStageId = parseInt(latestDeal.stage);

              const pipelineType = pipelineTypeMap.get(acGroupId);
              const stageName = stageNameMap.get(acStageId);
              const stageDbId = stageIdMap.get(acStageId);

              if (pipelineType === "customer") {
                // Moved to Customer Account Management — won
                dealUpdate = {
                  status: "yes",
                  currentPipelineStage: null,
                  stageEnteredAt: null,
                  previousStage: school.currentPipelineStage ?? school.previousStage,
                  ...(stageDbId ? { pipelineStageId: stageDbId } : {}),
                };
              } else if (pipelineType === "cold") {
                // Moved to Cold / Disqualified / Lost
                dealUpdate = {
                  status: "no",
                  currentPipelineStage: null,
                  stageEnteredAt: null,
                  previousStage: school.currentPipelineStage ?? school.previousStage,
                  ...(stageDbId ? { pipelineStageId: stageDbId } : {}),
                };
              } else if (stageName) {
                // Active sales pipeline — track stage changes
                const stageChanged = school.currentPipelineStage !== stageName;
                dealUpdate = {
                  status: "replied",
                  currentPipelineStage: stageName,
                  stageEnteredAt: stageChanged ? new Date() : school.stageEnteredAt,
                  previousStage: stageChanged
                    ? school.currentPipelineStage
                    : school.previousStage,
                  ...(stageDbId ? { pipelineStageId: stageDbId } : {}),
                };
              }
            }
          } catch (dealErr) {
            // Deal fetch failed — log it but continue with base contact update
            errors.push(
              `Contact ${contact.id} (deal fetch): ${dealErr instanceof Error ? dealErr.message : String(dealErr)}`
            );
          }

          await prisma.school.update({
            where: { id: school.id },
            data: { ...baseUpdate, ...dealUpdate },
          });

          contactsSynced++;
        } catch (err) {
          errors.push(
            `Contact ${contact.id}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        contactsSynced,
        errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "completed",
      contactsSynced,
      errorCount: errors.length,
    });
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        errors: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        error: "Sync failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
