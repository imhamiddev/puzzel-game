import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { computeProgress, isBoardComplete, computeServerFinishTime } from "@/lib/game/validation";
import { getStorageProvider } from "@/lib/storage";

/**
 * Called whenever a player places/moves a piece on the board.
 * The client sends its full current board state; the server is the sole
 * authority on move count (incremented by 1 per request), progress %,
 * and whether the puzzle is complete. Finish time is always computed
 * server-side from Room.startedAt — never trusted from the client.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = body.playerId as string | undefined;
  const board = body.board as { position: number; pieceIndex: number }[] | undefined;

  if (!playerId || !Array.isArray(board)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, status: true, startedAt: true, rows: true, cols: true },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.status !== "PLAYING" || !room.startedAt) {
    return NextResponse.json({ error: "Game is not in progress." }, { status: 409 });
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, roomId: true, moves: true, finished: true },
  });
  if (!player || player.roomId !== room.id) {
    return NextResponse.json({ error: "Player not found in this room." }, { status: 404 });
  }
  if (player.finished) {
    return NextResponse.json({ progress: 100, finished: true, moves: player.moves });
  }

  const totalPieces = room.rows * room.cols;
  const progress = computeProgress(board, totalPieces);
  const complete = isBoardComplete(board, totalPieces);
  const newMoves = player.moves + 1;

  if (complete) {
    const finishTime = computeServerFinishTime(room.startedAt);

    const { updated, allFinished } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.player.update({
        where: { id: player.id },
        data: {
          moves: newMoves,
          progress: 100,
          finished: true,
          finishTime,
          finishedAt: new Date(),
          lastSeenAt: new Date(),
        },
      });

      const remaining = await tx.player.count({
        where: { roomId: room.id, finished: false },
      });

      let allFinished = false;
      if (remaining === 0) {
        await tx.room.update({
          where: { id: room.id },
          data: { status: "FINISHED" },
        });
        allFinished = true;
      }

      return { updated, allFinished };
    });

    // Storage cleanup happens outside the transaction (it's not a DB
    // operation and shouldn't hold the transaction open while it runs).
    if (allFinished) {
      try {
        const storage = getStorageProvider();
        await storage.deletePrefix(`rooms/${room.code}`);
      } catch (err) {
        // Don't fail the request over a cleanup error — just log it.
        console.error(`Failed to clean up images for room ${room.code}:`, err);
      }
    }

    return NextResponse.json({
      progress: 100,
      finished: true,
      moves: updated.moves,
      finishTime: updated.finishTime,
    });
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { moves: newMoves, progress, lastSeenAt: new Date() },
  });

  return NextResponse.json({ progress: updated.progress, finished: false, moves: updated.moves });
}
