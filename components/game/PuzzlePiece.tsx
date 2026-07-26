"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

interface PuzzlePieceProps {
  id: string;
  imageUrl: string;
  size: number;
  locked?: boolean;
  correct?: boolean;
}

export default function PuzzlePieceComponent({ id, imageUrl, size, locked, correct }: PuzzlePieceProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: locked,
  });

  const style: React.CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "rounded-lg no-select shadow-md transition-shadow",
        isDragging && "z-50 shadow-card-lg scale-105 cursor-grabbing",
        !isDragging && !locked && "cursor-grab",
        correct && "ring-2 ring-accent shadow-glow-sm",
        locked && "opacity-95"
      )}
    />
  );
}
