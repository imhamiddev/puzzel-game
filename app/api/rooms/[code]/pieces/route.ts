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
      rows: true,
      cols: true,
      status: true,
      imageUrl: true,
      startedAt: true,
      pieces: {
        orderBy: { pieceIndex: "asc" },
        select: {
          id: true,
          pieceIndex: true,
          correctPosition: true,
          imageUrl: true,
          row: true,
          col: true,
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json({
    room: {
      rows: room.rows,
      cols: room.cols,
      status: room.status,
      startedAt: room.startedAt,
      previewUrl: room.imageUrl,
    },
    pieces: room.pieces,
  });
}
