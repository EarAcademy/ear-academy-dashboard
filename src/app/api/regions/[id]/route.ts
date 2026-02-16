import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { totalSchools } = body;

    if (typeof totalSchools !== "number" || totalSchools < 0) {
      return NextResponse.json(
        { error: "totalSchools must be a non-negative number" },
        { status: 400 }
      );
    }

    const region = await prisma.region.update({
      where: { id },
      data: { totalSchools },
      include: { market: true },
    });

    return NextResponse.json(region);
  } catch {
    return NextResponse.json(
      { error: "Failed to update region" },
      { status: 500 }
    );
  }
}
