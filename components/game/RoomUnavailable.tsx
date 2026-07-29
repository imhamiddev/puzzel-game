"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PuzzleIcon, Home } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface RoomUnavailableProps {
  title: string;
  description: string;
}

export default function RoomUnavailable({ title, description }: RoomUnavailableProps) {
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 safe-top safe-bottom">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card strong className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <PuzzleIcon className="h-7 w-7 text-white/50" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/50 text-sm mb-6">{description}</p>
          <Button fullWidth onClick={() => router.push("/")} icon={<Home className="h-5 w-5" />}>
            بازگشت به صفحه اصلی
          </Button>
        </Card>
      </motion.div>
    </main>
  );
}
