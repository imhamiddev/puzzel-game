"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import PuzzlePieceComponent from "./PuzzlePiece";

export interface BoardPieceData {
  id: string; // piece dnd-kit id, format `piece-{pieceIndex}`
  pieceIndex: number;
  imageUrl: string;
}

interface SlotProps {
  position: number;
  size: number;
  piece: BoardPieceData | null;
  isCorrect: boolean;
}

// Memoized because a board can have up to 64 slots (EXPERT difficulty).
// Without this, every drag/drop re-renders all 64 slots even though only
// 1-2 actually changed piece/isCorrect — this cuts that down to just the
// slots whose props actually changed.
const Slot = memo(function Slot({ position, size, piece, isCorrect }: SlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${position}` });

  return (
    <div
      ref={setNodeRef}
      style={{ width: size, height: size }}
      className={clsx(
        "rounded-lg border transition-colors flex items-center justify-center",
        isOver ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.02]",
        isCorrect && "border-accent/60"
      )}
    >
      {piece && (
        <PuzzlePieceComponent
          id={piece.id}
          imageUrl={piece.imageUrl}
          size={size}
          locked={isCorrect}
          correct={isCorrect}
        />
      )}
    </div>
  );
});

interface PuzzleBoardProps {
  rows: number;
  cols: number;
  boardSize: number;
  slots: (BoardPieceData | null)[]; // index = position
  correctSet: Set<number>; // positions that are correctly filled
}

export default function PuzzleBoard({ rows, cols, boardSize, slots, correctSet }: PuzzleBoardProps) {
  const gap = 3;
  const pieceSize = (boardSize - gap * (cols - 1)) / cols;

  return (
    <div
      dir="ltr"
      className="grid mx-auto no-select"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${pieceSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${pieceSize}px)`,
        gap,
        width: boardSize,
      }}
    >
      {slots.map((piece, position) => (
        <Slot
          key={position}
          position={position}
          size={pieceSize}
          piece={piece}
          isCorrect={correctSet.has(position)}
        />
      ))}
    </div>
  );
}
