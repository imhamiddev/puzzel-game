import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      code: true,
      hostId: true,
      imageUrl: true,
      gridSize: true,
      rows: true,
      cols: true,
      status: true,
      startedAt: true,
      createdAt: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json({ room });
}
