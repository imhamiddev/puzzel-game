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
      { error: "نام مستعار باید بین ۱ تا ۲۰ کاراکتر باشد." },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, status: true },
  });
  if (!room) {
    return NextResponse.json({ error: "اتاق پیدا نشد." }, { status: 404 });
  }
  if (room.status === "FINISHED") {
    return NextResponse.json(
      { error: "این بازی به پایان رسیده است." },
      { status: 409 }
    );
  }
  if (room.status !== "LOBBY") {
    return NextResponse.json(
      { error: "این بازی قبلاً شروع شده است و امکان پیوستن وجود ندارد." },
      { status: 409 }
    );
  }

  // Wrapped in a transaction so the count-check and create are atomic —
  // without this, two players joining at the exact same moment could both
  // pass the count check and push the room over the 20-player cap.
  const player = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCount = await tx.player.count({ where: { roomId: room.id } });
    if (existingCount >= 50) {
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
    return NextResponse.json({ error: "این اتاق پر است (حداکثر ۵۰ بازیکن)." }, { status: 409 });
  }

  return NextResponse.json({ playerId: player.id, roomId: room.id });
}

class RoomFullError extends Error {}
