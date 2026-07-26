/**
 * Server-side game validation helpers.
 *
 * The client never gets to declare "I won" directly with an arbitrary time.
 * Instead:
 *  - The server records `startedAt` on the Room when the host starts the game.
 *  - The client submits its current board state (an array mapping slot -> pieceId)
 *    on every move; the server recomputes progress/finished from that state
 *    and computes finishTime as (now - room.startedAt), never trusting a
 *    client-provided duration.
 *  - Moves count is incremented server-side once per accepted move request,
 *    not read from the client's internal counter.
 */

export interface BoardSlot {
  position: number; // slot index in the grid
  pieceIndex: number; // which piece currently occupies it
}

export function computeProgress(board: BoardSlot[], totalPieces: number): number {
  if (totalPieces === 0) return 0;
  const correct = board.filter((slot) => slot.position === slot.pieceIndex).length;
  return Math.round((correct / totalPieces) * 100);
}

export function isBoardComplete(board: BoardSlot[], totalPieces: number): boolean {
  if (board.length !== totalPieces) return false;
  return board.every((slot) => slot.position === slot.pieceIndex);
}

/**
 * Computes the authoritative finish time in milliseconds from the room's
 * server-recorded start timestamp. Never accept a client-supplied duration.
 */
export function computeServerFinishTime(startedAt: Date, now: Date = new Date()): number {
  const ms = now.getTime() - startedAt.getTime();
  return Math.max(0, ms);
}
