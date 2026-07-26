import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const nickname = (body.nickname as string | undefined)?.trim();

  if (!nickname || nickname.length < 1 || nickname.length > 20) {
    return NextResponse.json(
      { error: "Nickname must be between 1 and 20 characters." },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.status !== "LOBBY") {
    return NextResponse.json(
      { error: "This game has already started. You can't join right now." },
      { status: 409 }
    );
  }

  const existingCount = await prisma.player.count({ where: { roomId: room.id } });
  if (existingCount >= 20) {
    return NextResponse.json({ error: "This room is full (max 20 players)." }, { status: 409 });
  }

  const player = await prisma.player.create({
    data: {
      roomId: room.id,
      nickname,
      isHost: false,
    },
  });

  return NextResponse.json({ playerId: player.id, roomId: room.id });
}
