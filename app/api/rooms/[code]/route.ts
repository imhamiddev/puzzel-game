import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maybeAutoStartRoom } from "@/lib/game/auto-start";

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
      scheduledStartAt: true,
      createdAt: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "اتاق پیدا نشد." }, { status: 404 });
  }

  const flipped = await maybeAutoStartRoom(room);
  if (flipped) {
    room.status = flipped.status as typeof room.status;
    room.startedAt = flipped.startedAt;
  }

  return NextResponse.json({ room });
}
