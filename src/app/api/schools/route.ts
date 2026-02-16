import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (regionId) where.regionId = regionId;
  if (status) where.status = status;
  if (search) {
    where.name = { contains: search };
  }

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      include: { region: { include: { market: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.school.count({ where }),
  ]);

  return NextResponse.json({
    schools,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, regionId, type, email, phone, contactPerson, status, notes } =
      body;

    if (!name || !regionId) {
      return NextResponse.json(
        { error: "Name and region are required" },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        regionId,
        type: type || null,
        email: email || null,
        phone: phone || null,
        contactPerson: contactPerson || null,
        status: status || "uncontacted",
        notes: notes || null,
      },
      include: { region: { include: { market: true } } },
    });

    return NextResponse.json(school, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  }
}
