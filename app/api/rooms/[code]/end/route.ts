import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

/**
 * Lets the host manually end a game that's stuck in PLAYING — e.g. some
 * players finished, but a few never came back online, so the room would
 * otherwise sit "in progress" forever. Any player still unfinished is left
 * as-is (their progress/moves are kept) but the room is marked FINISHED so
 * everyone moves to the results screen.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = body.playerId as string | undefined;

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, hostId: true, status: true },
  });
  if (!room) {
    return NextResponse.json({ error: "اتاق پیدا نشد." }, { status: 404 });
  }
  if (room.hostId !== playerId) {
    return NextResponse.json({ error: "فقط میزبان می‌تواند بازی را پایان دهد." }, { status: 403 });
  }
  if (room.status !== "PLAYING" && room.status !== "COUNTDOWN") {
    return NextResponse.json({ error: "بازی در حال اجرا نیست." }, { status: 409 });
  }

  const updated = await prisma.room.update({
    where: { id: room.id },
    data: { status: "FINISHED" },
  });

  try {
    const storage = getStorageProvider();
    await storage.deletePrefix(`rooms/${room.code}`);
  } catch (err) {
    console.error(`Failed to clean up images for room ${room.code}:`, err);
  }

  return NextResponse.json({ status: updated.status });
}
