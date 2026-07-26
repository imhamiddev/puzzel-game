import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/game/room-code";
import { generatePuzzleFromImage } from "@/lib/game/puzzle-generator";
import { DIFFICULTIES, type DifficultyKey } from "@/lib/game/difficulty";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const nickname = (formData.get("nickname") as string | null)?.trim();
    const difficulty = (formData.get("difficulty") as string | null) as DifficultyKey | null;
    const password = (formData.get("password") as string | null) ?? "";

    const requiredPassword = process.env.CREATE_GAME_PASSWORD;
    if (requiredPassword && password !== requiredPassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }
    if (!nickname || nickname.length < 1 || nickname.length > 20) {
      return NextResponse.json(
        { error: "Nickname must be between 1 and 20 characters." },
        { status: 400 }
      );
    }
    if (!difficulty || !DIFFICULTIES[difficulty]) {
      return NextResponse.json({ error: "Invalid difficulty selected." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be smaller than 10MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique room code, retry on collision
    let code = generateRoomCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      code = generateRoomCode();
    }

    const { rows, cols } = DIFFICULTIES[difficulty];

    let generated;
    try {
      generated = await generatePuzzleFromImage(buffer, code, difficulty);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to process image." },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        code,
        hostId: "", // set after host player is created
        imageUrl: generated.fullImageUrl,
        imageWidth: generated.width,
        imageHeight: generated.height,
        gridSize: difficulty,
        rows,
        cols,
        status: "LOBBY",
        pieces: {
          create: generated.pieces.map((p) => ({
            pieceIndex: p.pieceIndex,
            correctPosition: p.correctPosition,
            imageUrl: p.imageUrl,
            row: p.row,
            col: p.col,
          })),
        },
      },
    });

    const host = await prisma.player.create({
      data: {
        roomId: room.id,
        nickname,
        isHost: true,
      },
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { hostId: host.id },
    });

    return NextResponse.json({
      roomCode: room.code,
      playerId: host.id,
    });
  } catch (err) {
    console.error("Room creation failed:", err);
    return NextResponse.json({ error: "Something went wrong creating the room." }, { status: 500 });
  }
}
