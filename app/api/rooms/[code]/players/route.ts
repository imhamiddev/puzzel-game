import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, status: true, startedAt: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const players = await prisma.player.findMany({
    where: { roomId: room.id },
    orderBy: [{ finished: "desc" }, { finishTime: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      nickname: true,
      isHost: true,
      finished: true,
      finishTime: true,
      moves: true,
      progress: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    status: room.status,
    startedAt: room.startedAt,
    players,
  });
}
