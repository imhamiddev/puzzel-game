"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Puzzle, Zap, Users, ArrowLeft, X, Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function HomePage() {
  const router = useRouter();
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");

  const goJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    router.push(`/room/${trimmed}/join`);
  };

  return (
    <main className="relative min-h-screen flex flex-col">
      <button
        onClick={() => router.push("/account")}
        className="absolute top-5 left-5 h-10 w-10 rounded-full glass flex items-center justify-center text-white/60 z-10 safe-top"
        aria-label="تنظیمات حساب"
      >
        <Settings className="h-5 w-5" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-16 w-16 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow mb-8 animate-float"
        >
          <Puzzle className="h-8 w-8 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl sm:text-6xl font-bold text-center tracking-tight text-gradient max-w-2xl leading-tight"
        >
          دوستانت را به چالش بکش.
          <br />
          سریع‌تر حل کن. ببر.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="text-white/50 text-center mt-5 max-w-md text-base sm:text-lg"
        >
          یک عکس آپلود کن، دوستانت را دعوت کن و برای حل پازل مسابقه بده.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-sm"
        >
          <Button fullWidth size="lg" onClick={() => router.push("/create")} icon={<Zap className="h-5 w-5" />}>
            ساخت بازی
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => setJoinOpen(true)}
            icon={<Users className="h-5 w-5" />}
          >
            پیوستن به بازی
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3 mt-16 w-full max-w-lg"
        >
          {[
            { label: "هر عکسی", value: "📸" },
            { label: "مسابقه زنده", value: "⚡" },
            { label: "جدول امتیازات", value: "🏆" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-2xl py-4 text-center">
              <p className="text-2xl mb-1">{f.value}</p>
              <p className="text-xs text-white/50 font-medium">{f.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {joinOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setJoinOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card strong className="relative">
              <button
                onClick={() => setJoinOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-xl font-bold text-white mb-1">پیوستن به بازی</h3>
              <p className="text-white/50 text-sm mb-5">کد اتاق دوستت را وارد کن</p>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && goJoin()}
                placeholder="ABC123"
                maxLength={6}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-center text-2xl font-bold tracking-[0.3em] text-white placeholder:text-white/20 outline-none focus:border-primary transition-colors mb-4"
              />
              <Button fullWidth onClick={goJoin} disabled={code.trim().length < 4} icon={<ArrowLeft className="h-5 w-5" />}>
                ادامه
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
