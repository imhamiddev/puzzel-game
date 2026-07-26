"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, X } from "lucide-react";
import { formatTime } from "./Timer";
import Button from "@/components/ui/Button";

interface WinnerModalProps {
  open: boolean;
  onClose: () => void;
  rank: number;
  finishTime: number;
  moves: number;
  onViewLeaderboard: () => void;
}

function fireConfetti() {
  const duration = 2200;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 65,
      origin: { x: 0 },
      colors: ["#7c5cff", "#00e5c7", "#ffd166"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 65,
      origin: { x: 1 },
      colors: ["#7c5cff", "#00e5c7", "#ffd166"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.4 },
    colors: ["#7c5cff", "#00e5c7", "#ffd166"],
  });
}

export default function WinnerModal({ open, onClose, rank, finishTime, moves, onViewLeaderboard }: WinnerModalProps) {
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  const isFirst = rank === 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="w-full max-w-sm glass-strong rounded-3xl p-7 text-center relative shadow-card-lg"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.15 }}
              className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                isFirst ? "bg-gold-gradient shadow-glow" : "bg-primary-gradient shadow-glow-sm"
              }`}
            >
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {isFirst ? "You Won! 🎉" : "Puzzle Complete!"}
            </h2>
            <p className="text-white/50 mb-6">
              {isFirst ? "You solved it fastest!" : `You finished in ${rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`} place`}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass rounded-2xl py-4">
                <p className="text-xs text-white/40 mb-1">Time</p>
                <p className="text-xl font-mono font-bold text-white">{formatTime(finishTime)}</p>
              </div>
              <div className="glass rounded-2xl py-4">
                <p className="text-xs text-white/40 mb-1">Moves</p>
                <p className="text-xl font-mono font-bold text-white">{moves}</p>
              </div>
            </div>

            <Button fullWidth onClick={onViewLeaderboard}>
              View Leaderboard
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
