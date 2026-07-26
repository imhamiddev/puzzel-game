"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { savePlayerSession, getPlayerSession } from "@/lib/hooks/usePlayerSession";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomExists, setRoomExists] = useState(false);

  useEffect(() => {
    // If already joined this room before, skip straight to lobby
    const existing = getPlayerSession(code);
    if (existing) {
      router.replace(`/room/${code}`);
      return;
    }

    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.room) {
          setRoomExists(true);
          if (data.room.status !== "LOBBY") {
            setError("This game has already started.");
          }
        } else {
          setError("Room not found. Check the code and try again.");
        }
      })
      .catch(() => setError("Could not load room."))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleJoin = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to join.");
        setLoading(false);
        return;
      }
      savePlayerSession(code, { playerId: data.playerId, nickname: nickname.trim() });
      router.push(`/room/${code}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 safe-top safe-bottom">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card strong>
          <div className="h-14 w-14 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-sm mx-auto mb-4">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-1">Join Room</h1>
          <p className="text-white/50 text-center text-sm mb-6">
            Room code <span className="font-mono font-semibold text-white/80">{code}</span>
          </p>

          {checking ? (
            <Skeleton className="h-14 w-full mb-4" />
          ) : roomExists ? (
            <>
              <input
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your nickname"
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-center text-lg font-medium text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors mb-4"
              />
              <Button
                fullWidth
                size="lg"
                disabled={!nickname.trim() || loading}
                loading={loading}
                onClick={handleJoin}
                icon={<ArrowRight className="h-5 w-5" />}
              >
                Join Game
              </Button>
            </>
          ) : null}

          {error && (
            <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl py-3 px-4 mt-4">{error}</p>
          )}
        </Card>
      </motion.div>
    </main>
  );
}
