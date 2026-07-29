"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { usePlayerAccount } from "@/lib/hooks/usePlayerSession";

export default function AccountPage() {
  const router = useRouter();
  const { account, loaded, save } = usePlayerAccount();
  const [nickname, setNickname] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded && account) setNickname(account.nickname);
  }, [loaded, account]);

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    save(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 safe-top safe-bottom">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card strong>
          <div className="h-14 w-14 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-sm mx-auto mb-4">
            <User className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-1">تنظیمات حساب</h1>
          <p className="text-white/50 text-center text-sm mb-6">
            نام شما به‌صورت خودکار در بازی‌های بعدی استفاده می‌شود
          </p>

          <label className="block text-sm font-semibold text-white/70 mb-2">نام نمایشی</label>
          <input
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="نام خود را وارد کنید"
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-center text-lg font-medium text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors mb-4"
          />

          <Button
            fullWidth
            size="lg"
            disabled={!nickname.trim()}
            onClick={handleSave}
            icon={saved ? <Check className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          >
            {saved ? "ذخیره شد!" : "ذخیره تغییرات"}
          </Button>

          <button
            onClick={() => router.push("/")}
            className="w-full text-center text-white/50 text-sm mt-5"
          >
            بازگشت به صفحه اصلی
          </button>
        </Card>
      </motion.div>
    </main>
  );
}
