import sharp from "sharp";
import { getStorageProvider } from "@/lib/storage";
import type { DifficultyKey } from "./difficulty";
import { DIFFICULTIES } from "./difficulty";

// Target canvas size the puzzle image is normalized to before splitting.
// Square canvas keeps piece math simple and consistent across images.
const CANVAS_SIZE = 960;

export interface GeneratedPiece {
  pieceIndex: number;
  correctPosition: number;
  row: number;
  col: number;
  imageUrl: string;
}

export interface PuzzleGenerationResult {
  pieces: GeneratedPiece[];
  fullImageUrl: string;
  width: number;
  height: number;
}

/**
 * Validates the uploaded image, resizes it to a square canvas, uploads the
 * full preview image, then splits it into rows*cols pieces and uploads each
 * piece as a compressed WebP file.
 */
export async function generatePuzzleFromImage(
  buffer: Buffer,
  roomCode: string,
  difficulty: DifficultyKey
): Promise<PuzzleGenerationResult> {
  const { rows, cols } = DIFFICULTIES[difficulty];
  const storage = getStorageProvider();

  // Validate: must be a real, decodable image
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error("Uploaded file is not a valid image.");
  }
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions.");
  }
  if (metadata.width < 200 || metadata.height < 200) {
    throw new Error("Image is too small. Please use an image at least 200x200px.");
  }

  // Normalize to a square canvas (center-cropped) for consistent piece sizing
  const normalized = sharp(buffer)
    .rotate() // auto-orient based on EXIF
    .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "cover", position: "centre" });

  const normalizedBuffer = await normalized.toBuffer();

  // Upload full preview image (shown in lobby)
  const previewBuffer = await sharp(normalizedBuffer)
    .webp({ quality: 82 })
    .toBuffer();
  const previewUpload = await storage.upload(
    `rooms/${roomCode}/preview.webp`,
    previewBuffer,
    "image/webp"
  );

  const pieceWidth = Math.floor(CANVAS_SIZE / cols);
  const pieceHeight = Math.floor(CANVAS_SIZE / rows);

  const pieces: GeneratedPiece[] = [];
  const total = rows * cols;

  // Generate all pieces in parallel batches for speed, but cap concurrency
  const tasks: Array<() => Promise<GeneratedPiece>> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      tasks.push(async () => {
        const left = c * pieceWidth;
        const top = r * pieceHeight;
        const pieceBuffer = await sharp(normalizedBuffer)
          .extract({ left, top, width: pieceWidth, height: pieceHeight })
          .webp({ quality: 80 })
          .toBuffer();

        const uploaded = await storage.upload(
          `rooms/${roomCode}/piece_${index + 1}.webp`,
          pieceBuffer,
          "image/webp"
        );

        return {
          pieceIndex: index,
          correctPosition: index,
          row: r,
          col: c,
          imageUrl: uploaded.url,
        };
      });
    }
  }

  // Run with limited concurrency to avoid overwhelming serverless memory/network
  const CONCURRENCY = 6;
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((t) => t()));
    pieces.push(...results);
  }

  pieces.sort((a, b) => a.pieceIndex - b.pieceIndex);

  if (pieces.length !== total) {
    throw new Error("Failed to generate all puzzle pieces.");
  }

  return {
    pieces,
    fullImageUrl: previewUpload.url,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  };
}
