import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateRoomCode } from "@/lib/game/room-code";
import { generatePuzzleFromImage, type PuzzleGenerationResult } from "@/lib/game/puzzle-generator";
import { DIFFICULTIES, type DifficultyKey } from "@/lib/game/difficulty";
import { getStorageProvider } from "@/lib/storage";

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
    const scheduledStartAtRaw = formData.get("scheduledStartAt") as string | null;

    const requiredPassword = process.env.CREATE_GAME_PASSWORD;
    if (requiredPassword && password !== requiredPassword) {
      return NextResponse.json({ error: "رمز عبور اشتباه است." }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "هیچ تصویری آپلود نشده است." }, { status: 400 });
    }
    if (!nickname || nickname.length < 1 || nickname.length > 20) {
      return NextResponse.json(
        { error: "نام مستعار باید بین ۱ تا ۲۰ کاراکتر باشد." },
        { status: 400 }
      );
    }
    if (!difficulty || !DIFFICULTIES[difficulty]) {
      return NextResponse.json({ error: "سطح دشواری انتخاب‌شده نامعتبر است." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع تصویر پشتیبانی نمی‌شود. از JPG، PNG، WebP یا GIF استفاده کنید." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم تصویر باید کمتر از ۱۰ مگابایت باشد." }, { status: 400 });
    }

    let scheduledStartAt: Date | null = null;
    if (scheduledStartAtRaw) {
      const parsed = new Date(scheduledStartAtRaw);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "زمان شروع نامعتبر است." }, { status: 400 });
      }
      if (parsed.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "زمان شروع باید در آینده باشد." },
          { status: 400 }
        );
      }
      scheduledStartAt = parsed;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { rows, cols } = DIFFICULTIES[difficulty];

    // generatePuzzleFromImage uploads pieces under a path keyed by the room
    // code, so we need a code up front. A pre-check findUnique here would
    // still race against another concurrent create between the check and
    // the actual insert, so instead we generate pieces once and then retry
    // the whole create-with-a-fresh-code loop if the code collides — this
    // is rare (6 chars from a 32-letter alphabet) but should never surface
    // as a hard failure to the user, especially after they've waited for
    // image processing to finish.
    let code = generateRoomCode();
    let generated: PuzzleGenerationResult;
    try {
      generated = await generatePuzzleFromImage(buffer, code, difficulty);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "پردازش تصویر با خطا مواجه شد." },
        { status: 400 }
      );
    }

    const MAX_CODE_ATTEMPTS = 3;
    let room: { code: string } | undefined;
    let host: { id: string } | undefined;
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const room = await tx.room.create({
            data: {
              code,
              hostId: "", // set right after host player is created, in the same transaction
              imageUrl: generated.fullImageUrl,
              imageWidth: generated.width,
              imageHeight: generated.height,
              gridSize: difficulty,
              rows,
              cols,
              status: "LOBBY",
              scheduledStartAt,
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

          const host = await tx.player.create({
            data: {
              roomId: room.id,
              nickname,
              isHost: true,
            },
          });

          await tx.room.update({
            where: { id: room.id },
            data: { hostId: host.id },
          });

          return { room, host };
        });
        room = result.room;
        host = result.host;
        break;
      } catch (err) {
        // P2002 = unique constraint violation (the `code` column). Retry
        // with a fresh code rather than failing the whole request — the
        // uploaded pieces are already stored under the old code's path, so
        // move them to the new one before trying again.
        const isCodeCollision =
          typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
        if (!isCodeCollision || attempt === MAX_CODE_ATTEMPTS - 1) {
          throw err;
        }
        const oldCode = code;
        code = generateRoomCode();
        generated = await generatePuzzleFromImage(buffer, code, difficulty);
        const storage = getStorageProvider();
        await storage.deletePrefix(`rooms/${oldCode}`).catch(() => {});
      }
    }

    if (!room || !host) {
      return NextResponse.json({ error: "خطایی در ساخت اتاق رخ داد." }, { status: 500 });
    }

    return NextResponse.json({
      roomCode: room.code,
      playerId: host.id,
    });
  } catch (err) {
    console.error("Room creation failed:", err);
    return NextResponse.json({ error: "خطایی در ساخت اتاق رخ داد." }, { status: 500 });
  }
}
