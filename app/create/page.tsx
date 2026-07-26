"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UploadBox from "@/components/game/UploadBox";
import DifficultySelector from "@/components/game/DifficultySelector";
import type { DifficultyKey } from "@/lib/game/difficulty";
import { savePlayerSession } from "@/lib/hooks/usePlayerSession";

export default function CreateRoomPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyKey>("MEDIUM");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!file && nickname.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleCreate = async () => {
    if (!file || !nickname.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("nickname", nickname.trim());
      formData.append("difficulty", difficulty);
      formData.append("password", password);

      const res = await fetch("/api/rooms/create", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room.");
        setLoading(false);
        return;
      }

      savePlayerSession(data.roomCode, { playerId: data.playerId, nickname: nickname.trim() });
      router.push(`/room/${data.roomCode}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-5 py-6 safe-top safe-bottom">
      <AnimatedBackground />

      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full glass flex items-center justify-center text-white/70 mb-5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white mb-1"
        >
          Create a Room
        </motion.h1>
        <p className="text-white/50 mb-6">Upload a photo and pick your difficulty</p>

        <div className="space-y-5">
          <UploadBox onFileSelected={setFile} />

          <Card>
            <label className="block text-sm font-semibold text-white/70 mb-2">Your Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="Enter your name"
              className="w-full h-13 h-[52px] rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 outline-none focus:border-primary transition-colors"
            />
          </Card>

          <div>
            <p className="text-sm font-semibold text-white/70 mb-3 px-1">Difficulty</p>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <Card>
            <label className="block text-sm font-semibold text-white/70 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the room creation password"
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
            {loading ? "Creating Puzzle…" : "Create Puzzle Room"}
          </Button>
        </div>
      </div>
    </main>
  );
}
