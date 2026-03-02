import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportRow {
  name: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const { rows, regionId } = (await request.json()) as {
      rows: ImportRow[];
      regionId: string;
    };

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided" },
        { status: 400 }
      );
    }

    const region = await prisma.region.findUnique({ where: { id: regionId } });
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const name = row.name?.trim();
      if (!name) continue;

      const existing = await prisma.school.findFirst({
        where: { name: { equals: name }, regionId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.school.create({
        data: {
          name,
          regionId,
          email: row.email?.trim() || null,
          status: "uncontacted",
        },
      });
      created++;
    }

    return NextResponse.json({ created, skipped, total: rows.length, errors });
  } catch {
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
}
