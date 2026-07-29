"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Puzzle as PuzzleIcon, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import RoomCard from "@/components/game/RoomCard";
import RoomUnavailable from "@/components/game/RoomUnavailable";
import PlayerList, { type LobbyPlayer } from "@/components/game/PlayerList";
import { usePlayerSession } from "@/lib/hooks/usePlayerSession";
import { DIFFICULTIES } from "@/lib/game/difficulty";
import { formatTehranTime } from "@/lib/game/tehran-time";

interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  imageUrl: string;
  gridSize: keyof typeof DIFFICULTIES;
  rows: number;
  cols: number;
  status: "LOBBY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  scheduledStartAt?: string | null;
}

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();

  const { session, loaded } = usePlayerSession(code);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = !!(room && session && room.hostId === session.playerId);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    const data = await res.json();
    if (res.ok) setRoom(data.room);
    else setNotFound(true);
    return data.room as RoomInfo | undefined;
  }, [code]);

  const fetchPlayers = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}/players`);
    const data = await res.json();
    if (res.ok) setPlayers(data.players);
    return data;
  }, [code]);

  // Redirect to join page if no session found for this room
  useEffect(() => {
    if (loaded && !session) {
      router.replace(`/room/${code}/join`);
    }
  }, [loaded, session, code, router]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Poll players + room status every 2s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const data = await fetchPlayers();
      if (data.status === "FINISHED") {
        router.push(`/room/${code}/results`);
        return;
      }
      if (data.status && data.status !== "LOBBY") {
        router.push(`/room/${code}/play`);
      }
    }, 2000);
    fetchPlayers();
    return () => clearInterval(interval);
  }, [session, fetchPlayers, code, router]);

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "شروع بازی با خطا مواجه شد.");
        setStarting(false);
        return;
      }
      router.push(`/room/${code}/play`);
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
      setStarting(false);
    }
  };

  const inviteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/room/${code}/join` : "";

  const difficultyLabel = room ? DIFFICULTIES[room.gridSize]?.description : "";

  if (notFound) {
    return (
      <RoomUnavailable
        title="اتاق پیدا نشد"
        description="اتاقی با این کد پیدا نشد. لطفاً کد را بررسی کنید."
      />
    );
  }

  if (room?.status === "FINISHED") {
    return (
      <RoomUnavailable
        title="این بازی به پایان رسیده است"
        description="می‌توانید نتایج نهایی را در صفحه نتایج مشاهده کنید."
      />
    );
  }

  return (
    <main className="relative min-h-screen px-5 py-6 safe-top safe-bottom">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center mb-2">
          <div className="inline-flex h-11 w-11 rounded-2xl bg-primary-gradient items-center justify-center shadow-glow-sm mb-3">
            <PuzzleIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">اتاق انتظار</h1>
        </div>

        {room ? (
          <>
            <RoomCard code={room.code} inviteUrl={inviteUrl} />

            <Card>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 glass">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={room.imageUrl} alt="پیش‌نمایش پازل" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-semibold">پیش‌نمایش پازل</p>
                  <p className="text-white/50 text-sm">{difficultyLabel}</p>
                </div>
              </div>
            </Card>

            {room.scheduledStartAt && (
              <Card className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">شروع خودکار زمان‌بندی‌شده</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {formatTehranTime(room.scheduledStartAt)} (به وقت تهران)
                  </p>
                </div>
              </Card>
            )}

            <PlayerList players={players} />

            {error && (
              <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl py-3 px-4">{error}</p>
            )}

            {isHost ? (
              <Button
                fullWidth
                size="lg"
                onClick={handleStart}
                loading={starting}
                icon={<Play className="h-5 w-5" />}
              >
                شروع بازی
              </Button>
            ) : (
              <Card className="text-center py-5">
                <p className="text-white/50 text-sm">
                  {room.scheduledStartAt
                    ? "در انتظار زمان شروع خودکار یا شروع دستی توسط میزبان…"
                    : "در انتظار شروع بازی توسط میزبان…"}
                </p>
              </Card>
            )}
          </>
        ) : (
          <div className="space-y-5">
            <Skeleton className="h-52 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        )}
      </div>
    </main>
  );
}
