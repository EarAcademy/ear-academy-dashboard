import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSchoolCSV } from "@/lib/csv-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const { valid, errors } = parseSchoolCSV(csvText);

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "No valid records found", errors },
        { status: 400 }
      );
    }

    // Get all regions for matching
    const regions = await prisma.region.findMany({
      include: { market: true },
    });

    const regionMap = new Map<string, string>();
    for (const r of regions) {
      regionMap.set(r.name.toLowerCase().trim(), r.id);
    }

    let created = 0;
    let skipped = 0;
    const uploadErrors: string[] = [...errors];

    for (const row of valid) {
      const regionId = regionMap.get(row.region.toLowerCase().trim());
      if (!regionId) {
        uploadErrors.push(
          `"${row.name}": Unknown region "${row.region}"`
        );
        skipped++;
        continue;
      }

      // Check for duplicate by name + region
      const existing = await prisma.school.findFirst({
        where: {
          name: { equals: row.name },
          regionId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.school.create({
        data: {
          name: row.name,
          regionId,
          type: row.type || null,
          email: row.email || null,
          phone: row.phone || null,
          contactPerson: row.contactPerson || null,
          status: "uncontacted",
        },
      });
      created++;
    }

    return NextResponse.json({
      created,
      skipped,
      total: valid.length,
      errors: uploadErrors,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
