"use client";

import { useDroppable } from "@dnd-kit/core";
import PuzzlePieceComponent from "./PuzzlePiece";
import type { BoardPieceData } from "./PuzzleBoard";

interface PieceTrayProps {
  pieces: BoardPieceData[];
  pieceSize: number;
}

export default function PieceTray({ pieces, pieceSize }: PieceTrayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-2.5 transition-colors ${
        isOver ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 no-select" style={{ minHeight: pieceSize }}>
        {pieces.length === 0 && (
          <p className="text-white/30 text-sm py-2 px-1">تمام قطعات روی تخته قرار گرفتند</p>
        )}
        {pieces.map((piece) => (
          <div key={piece.id} className="shrink-0">
            <PuzzlePieceComponent id={piece.id} imageUrl={piece.imageUrl} size={pieceSize} />
          </div>
        ))}
      </div>
    </div>
  );
}
