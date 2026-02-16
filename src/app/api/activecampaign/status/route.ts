import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lastSync = await prisma.syncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const linkedSchools = await prisma.school.count({
    where: { activeCampaignId: { not: null } },
  });

  return NextResponse.json({
    lastSync,
    linkedSchools,
  });
}
