"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UploadBox from "@/components/game/UploadBox";
import DifficultySelector from "@/components/game/DifficultySelector";
import type { DifficultyKey } from "@/lib/game/difficulty";
import { savePlayerSession, usePlayerAccount } from "@/lib/hooks/usePlayerSession";
import { tehranLocalToUtc } from "@/lib/game/tehran-time";

export default function CreateRoomPage() {
  const router = useRouter();
  const { account, loaded: accountLoaded, save: saveAccount } = usePlayerAccount();
  const [file, setFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyKey>("MEDIUM");
  const [password, setPassword] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the saved account so returning users don't retype their name.
  useEffect(() => {
    if (accountLoaded && account) setNickname(account.nickname);
  }, [accountLoaded, account]);

  const canSubmit = !!file && nickname.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleCreate = async () => {
    if (!file || !nickname.trim()) return;
    setLoading(true);
    setError(null);

    if (scheduleEnabled && !scheduledLocal) {
      setError("لطفاً تاریخ و ساعت شروع را انتخاب کنید.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("nickname", nickname.trim());
      formData.append("difficulty", difficulty);
      formData.append("password", password);

      if (scheduleEnabled && scheduledLocal) {
        const utc = tehranLocalToUtc(scheduledLocal);
        if (!utc) {
          setError("تاریخ و ساعت وارد شده نامعتبر است.");
          setLoading(false);
          return;
        }
        formData.append("scheduledStartAt", utc.toISOString());
      }

      const res = await fetch("/api/rooms/create", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ساخت اتاق با خطا مواجه شد.");
        setLoading(false);
        return;
      }

      saveAccount(nickname.trim());
      savePlayerSession(data.roomCode, { playerId: data.playerId, nickname: nickname.trim() });
      router.push(`/room/${data.roomCode}`);
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-5 py-6 safe-top safe-bottom">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full glass flex items-center justify-center text-white/70 mb-5"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white mb-1"
        >
          ساخت اتاق جدید
        </motion.h1>
        <p className="text-white/50 mb-6">یک عکس آپلود کنید و سطح دشواری را انتخاب کنید</p>

        <div className="space-y-5">
          <UploadBox onFileSelected={setFile} />

          <Card>
            <label className="block text-sm font-semibold text-white/70 mb-2">نام مستعار شما</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="نام خود را وارد کنید"
              className="w-full h-13 h-[52px] rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors"
            />
          </Card>

          <div>
            <p className="text-sm font-semibold text-white/70 mb-3 px-1">سطح دشواری</p>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-white/70">
                <Clock className="h-4 w-4" /> شروع خودکار زمان‌بندی‌شده
              </label>
              <button
                type="button"
                onClick={() => setScheduleEnabled((v) => !v)}
                className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${
                  scheduleEnabled ? "bg-primary" : "bg-white/15"
                }`}
                aria-pressed={scheduleEnabled}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    scheduleEnabled ? "translate-x-[-22px]" : "translate-x-[-2px]"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-white/40 mb-3">
              اگر فعال باشد، بازی به‌طور خودکار در تاریخ و ساعت مشخص‌شده (به وقت تهران) شروع می‌شود
            </p>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="w-full h-13 h-[52px] rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-primary transition-colors [color-scheme:dark]"
              />
            )}
          </Card>

          <Card>
            <label className="block text-sm font-semibold text-white/70 mb-2">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز ساخت اتاق را وارد کنید"
              className="w-full h-13 h-[52px] rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors"
            />
          </Card>

          {error && (
            <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl py-3 px-4">{error}</p>
          )}

          <Button
            fullWidth
            size="lg"
            disabled={!canSubmit}
            loading={loading}
            onClick={handleCreate}
            icon={<Sparkles className="h-5 w-5" />}
          >
            {loading ? "در حال ساخت پازل…" : "ساخت اتاق پازل"}
          </Button>
        </div>
      </div>
    </main>
  );
}
