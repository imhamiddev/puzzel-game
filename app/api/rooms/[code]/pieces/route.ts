import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      status: true,
      rows: true,
      cols: true,
      imageUrl: true,
      startedAt: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const pieces = await prisma.puzzlePiece.findMany({
    where: { roomId: room.id },
    orderBy: { pieceIndex: "asc" },
    select: {
      id: true,
      pieceIndex: true,
      correctPosition: true,
      imageUrl: true,
      row: true,
      col: true,
    },
  });

  return NextResponse.json({
    room: {
      rows: room.rows,
      cols: room.cols,
      status: room.status,
      startedAt: room.startedAt,
      previewUrl: room.imageUrl,
    },
    pieces,
  });
}
