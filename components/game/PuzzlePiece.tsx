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

  // Note: this used to be a CSS `background-image` div. With dozens of tiles
  // on screen at once, browsers (Chrome/Android in particular) can create a
  // GPU compositing layer for a draggable element (from dnd-kit's transform)
  // before the background-image has finished decoding. When that happens the
  // browser sometimes never rasterizes the background into that layer until
  // something forces a repaint — which is exactly why the tile only "appears"
  // once you start dragging it. Using a real <img> avoids that class of bug
  // entirely, since <img> has its own paint/layer handling and doesn't rely
  // on the background-image repaint path.
  const style: React.CSSProperties = {
    width: size,
    height: size,
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
        "relative overflow-hidden rounded-lg no-select shadow-md transition-shadow",
        isDragging && "z-50 shadow-card-lg scale-105 cursor-grabbing",
        !isDragging && !locked && "cursor-grab",
        correct && "ring-2 ring-accent shadow-glow-sm",
        locked && "opacity-95"
      )}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        decoding="async"
        className="block w-full h-full object-cover pointer-events-none select-none no-select"
      />
    </div>
  );
}
