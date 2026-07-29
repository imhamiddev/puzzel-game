import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COUNTDOWN_MS } from "@/lib/game/auto-start";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = body.playerId as string | undefined;

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, hostId: true, status: true },
  });
  if (!room) {
    return NextResponse.json({ error: "اتاق پیدا نشد." }, { status: 404 });
  }
  if (room.hostId !== playerId) {
    return NextResponse.json({ error: "فقط میزبان می‌تواند بازی را شروع کند." }, { status: 403 });
  }
  if (room.status !== "LOBBY") {
    return NextResponse.json({ error: "بازی قبلاً شروع شده است." }, { status: 409 });
  }

  const playerCount = await prisma.player.count({ where: { roomId: room.id } });
  if (playerCount < 1) {
    return NextResponse.json({ error: "برای شروع حداقل به ۱ بازیکن نیاز است." }, { status: 400 });
  }

  // startedAt is set in the future so all polling clients can show the same
  // countdown, and the game timer begins at exactly this server timestamp.
  const startedAt = new Date(Date.now() + COUNTDOWN_MS);

  const updated = await prisma.room.update({
    where: { id: room.id },
    data: { status: "PLAYING", startedAt },
  });

  return NextResponse.json({ status: updated.status, startedAt: updated.startedAt });
}
