import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const school = await prisma.school.findUnique({
    where: { id },
    include: { region: { include: { market: true } }, pipelineStage: { include: { pipeline: true } } },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  return NextResponse.json(school);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const school = await prisma.school.update({
      where: { id },
      data: body,
      include: { region: { include: { market: true } } },
    });
    return NextResponse.json(school);
  } catch {
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.school.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete school" },
      { status: 500 }
    );
  }
}
