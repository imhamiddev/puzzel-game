"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Home, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Leaderboard, { type LeaderboardEntry } from "@/components/game/Leaderboard";
import { usePlayerSession } from "@/lib/hooks/usePlayerSession";

export default function ResultsPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { session, loaded } = usePlayerSession(code);

  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}/leaderboard`);
    const data = await res.json();
    if (res.ok) setEntries(data.players);
  }, [code]);

  useEffect(() => {
    if (loaded && !session) {
      router.replace(`/room/${code}/join`);
    }
  }, [loaded, session, code, router]);

  useEffect(() => {
    let stopped = false;
    fetchLeaderboard();
    const interval = setInterval(async () => {
      if (stopped) return;
      const res = await fetch(`/api/rooms/${code}/leaderboard`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.players);
        // Stop polling once every player has finished — nothing left to
        // update, so continuing to hit the API every 3s would just waste
        // requests for both the client and the server.
        if (data.players.length > 0 && data.players.every((p: LeaderboardEntry) => p.finished)) {
          stopped = true;
          clearInterval(interval);
        }
      }
    }, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [fetchLeaderboard, code]);

  const allFinished = entries?.every((e) => e.finished) ?? false;

  return (
    <main className="relative min-h-screen px-5 py-6 safe-top safe-bottom">
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gold-gradient items-center justify-center shadow-glow mb-3">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Final Results</h1>
          <p className="text-white/50 text-sm mt-1">
            {allFinished ? "Everyone has finished!" : "Live results — refreshing automatically"}
          </p>
        </motion.div>

        {entries ? (
          <Leaderboard entries={entries} highlightId={session?.playerId} />
        ) : (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <Button variant="secondary" fullWidth onClick={() => router.push("/")} icon={<Home className="h-5 w-5" />}>
            Home
          </Button>
          <Button fullWidth onClick={() => router.push("/create")} icon={<RotateCcw className="h-5 w-5" />}>
            New Game
          </Button>
        </div>
      </div>
    </main>
  );
}
