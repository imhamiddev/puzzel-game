import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, status: true },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.status !== "LOBBY") {
    return NextResponse.json(
      { error: "This game has already started. You can't join right now." },
      { status: 409 }
    );
  }

  // Wrapped in a transaction so the count-check and create are atomic —
  // without this, two players joining at the exact same moment could both
  // pass the count check and push the room over the 20-player cap.
  const player = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCount = await tx.player.count({ where: { roomId: room.id } });
    if (existingCount >= 20) {
      throw new RoomFullError();
    }
    return tx.player.create({
      data: {
        roomId: room.id,
        nickname,
        isHost: false,
      },
    });
  }).catch((err: unknown) => {
    if (err instanceof RoomFullError) return null;
    throw err;
  });

  if (!player) {
    return NextResponse.json({ error: "This room is full (max 20 players)." }, { status: 409 });
  }

  return NextResponse.json({ playerId: player.id, roomId: room.id });
}

class RoomFullError extends Error {}
