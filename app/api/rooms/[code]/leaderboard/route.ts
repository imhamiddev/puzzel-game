import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, status: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  // Ranking: 1) fastest completion time, 2) lowest moves.
  // Unfinished players appear after finished ones, ordered by progress.
  const players = await prisma.player.findMany({
    where: { roomId: room.id },
    orderBy: [
      { finished: "desc" },
      { finishTime: "asc" },
      { moves: "asc" },
      { progress: "desc" },
    ],
    select: {
      id: true,
      nickname: true,
      finished: true,
      finishTime: true,
      moves: true,
      progress: true,
      finishedAt: true,
    },
  });

  return NextResponse.json({ status: room.status, players });
}
