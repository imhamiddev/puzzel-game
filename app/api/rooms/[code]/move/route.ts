import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeProgress, isBoardComplete, computeServerFinishTime } from "@/lib/game/validation";

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

  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.status !== "PLAYING" || !room.startedAt) {
    return NextResponse.json({ error: "Game is not in progress." }, { status: 409 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
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
    const updated = await prisma.player.update({
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
