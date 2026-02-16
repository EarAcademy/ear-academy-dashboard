import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get("marketId");

  const regions = await prisma.region.findMany({
    where: marketId ? { marketId } : undefined,
    include: {
      market: true,
      _count: { select: { schools: true } },
    },
    orderBy: [{ market: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(regions);
}
