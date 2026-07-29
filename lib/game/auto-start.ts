import { prisma } from "@/lib/prisma";

export const COUNTDOWN_MS = 3500; // 3, 2, 1, GO — gives clients time to sync before "PLAYING"

/**
 * Checks whether a LOBBY room has a scheduledStartAt in the past and, if so,
 * flips it to PLAYING with a short countdown — the same transition the host's
 * manual "Start Game" button performs. There's no background cron in this
 * deployment, so this is invoked opportunistically from the polling endpoints
 * (room GET, players GET) that clients already hit every couple seconds while
 * sitting in the lobby. This guarantees the scheduled start fires even if the
 * host's own browser tab is closed, as long as at least one connected client
 * (host or a joined player) is polling.
 */
export async function maybeAutoStartRoom(room: {
  id: string;
  status: string;
  scheduledStartAt: Date | null;
}): Promise<{ status: string; startedAt: Date | null } | null> {
  if (room.status !== "LOBBY" || !room.scheduledStartAt) return null;
  if (room.scheduledStartAt.getTime() > Date.now()) return null;

  const playerCount = await prisma.player.count({ where: { roomId: room.id } });
  if (playerCount < 1) return null;

  try {
    const updated = await prisma.room.update({
      where: { id: room.id, status: "LOBBY" },
      data: { status: "PLAYING", startedAt: new Date(Date.now() + COUNTDOWN_MS) },
    });
    return { status: updated.status, startedAt: updated.startedAt };
  } catch {
    // Another concurrent poll already flipped it — ignore.
    return null;
  }
}
