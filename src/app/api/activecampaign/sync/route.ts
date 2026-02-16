import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acClient } from "@/lib/activecampaign";

export async function POST() {
  const syncLog = await prisma.syncLog.create({
    data: { syncType: "contacts", status: "running" },
  });

  try {
    let contactsSynced = 0;
    const errors: string[] = [];

    // Get all pipeline stages for mapping
    const stages = await prisma.pipelineStage.findMany();
    const stageMap = new Map(stages.map((s) => [s.acStageId, s.id]));

    // Paginate through all AC contacts
    for await (const contacts of acClient.getAllContacts()) {
      for (const contact of contacts) {
        try {
          // Try to find existing school by AC ID or email
          let school = await prisma.school.findFirst({
            where: {
              OR: [
                { activeCampaignId: contact.id },
                ...(contact.email ? [{ email: contact.email }] : []),
              ],
            },
          });

          if (school) {
            // Update existing school with AC ID
            await prisma.school.update({
              where: { id: school.id },
              data: {
                activeCampaignId: contact.id,
                ...(contact.phone && !school.phone
                  ? { phone: contact.phone }
                  : {}),
              },
            });

            // Check for deals to update pipeline stage
            try {
              const dealData = await acClient.getContactDeals(contact.id);
              if (dealData.deals && dealData.deals.length > 0) {
                // Use the most recent deal
                const latestDeal = dealData.deals[dealData.deals.length - 1];
                const stageId = stageMap.get(parseInt(latestDeal.stage));
                if (stageId) {
                  await prisma.school.update({
                    where: { id: school.id },
                    data: { pipelineStageId: stageId },
                  });
                }
              }
            } catch {
              // Deal fetch failed, skip pipeline update
            }

            contactsSynced++;
          }
          // Skip contacts with no matching school (they'll need CSV import first)
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
      { error: "Sync failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
