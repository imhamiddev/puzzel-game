"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import RoomUnavailable from "@/components/game/RoomUnavailable";
import { savePlayerSession, getPlayerSession, usePlayerAccount } from "@/lib/hooks/usePlayerSession";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { account, loaded: accountLoaded, save: saveAccount } = usePlayerAccount();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomExists, setRoomExists] = useState(false);
  const [roomFinished, setRoomFinished] = useState(false);

  useEffect(() => {
    if (accountLoaded && account) setNickname(account.nickname);
  }, [accountLoaded, account]);

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
          if (data.room.status === "FINISHED") {
            setRoomFinished(true);
          } else if (data.room.status !== "LOBBY") {
            setError("این بازی قبلاً شروع شده است.");
            setRoomExists(true);
          } else {
            setRoomExists(true);
          }
        } else {
          setError("اتاق پیدا نشد. کد را بررسی کرده و دوباره تلاش کنید.");
        }
      })
      .catch(() => setError("بارگذاری اتاق ممکن نشد."))
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
        setError(data.error || "پیوستن ممکن نشد.");
        setLoading(false);
        return;
      }
      saveAccount(nickname.trim());
      savePlayerSession(code, { playerId: data.playerId, nickname: nickname.trim() });
      router.push(`/room/${code}`);
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  if (!checking && roomFinished) {
    return (
      <RoomUnavailable
        title="این بازی به پایان رسیده است"
        description="اتاق مورد نظر دیگر فعال نیست و امکان پیوستن به آن وجود ندارد."
      />
    );
  }

  if (!checking && !roomExists && !roomFinished) {
    return (
      <RoomUnavailable
        title="صفحه پیدا نشد"
        description="اتاقی با این کد پیدا نشد. لطفاً کد را بررسی کنید."
      />
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 safe-top safe-bottom">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card strong>
          <div className="h-14 w-14 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-sm mx-auto mb-4">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-1">پیوستن به اتاق</h1>
          <p className="text-white/50 text-center text-sm mb-6">
            کد اتاق <span className="font-mono font-semibold text-white/80">{code}</span>
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
                placeholder="نام مستعار خود را وارد کنید"
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-center text-lg font-medium text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors mb-4"
              />
              <Button
                fullWidth
                size="lg"
                disabled={!nickname.trim() || loading}
                loading={loading}
                onClick={handleJoin}
                icon={<ArrowLeft className="h-5 w-5" />}
              >
                پیوستن به بازی
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
