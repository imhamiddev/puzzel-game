"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { formatTime } from "./Timer";
import clsx from "clsx";

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  finished: boolean;
  finishTime: number | null;
  moves: number;
  progress: number;
}

const medalStyles = [
  { emoji: "🥇", ring: "ring-gold/60", text: "text-gold", bg: "bg-gold-gradient" },
  { emoji: "🥈", ring: "ring-silver/50", text: "text-silver", bg: "bg-gradient-to-br from-slate-300 to-slate-400" },
  { emoji: "🥉", ring: "ring-bronze/50", text: "text-bronze", bg: "bg-gradient-to-br from-orange-300 to-orange-500" },
];

export default function Leaderboard({ entries, highlightId }: { entries: LeaderboardEntry[]; highlightId?: string }) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry, i) => {
        const medal = medalStyles[i];
        const isMe = entry.id === highlightId;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={clsx(
              "flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors",
              medal ? "glass-strong ring-2 " + medal.ring : "glass",
              isMe && "outline outline-2 outline-primary"
            )}
          >
            <div
              className={clsx(
                "h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-lg font-bold",
                medal ? medal.bg + " text-black/80" : "bg-white/10 text-white/70"
              )}
            >
              {medal ? medal.emoji : i + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate flex items-center gap-2">
                {entry.nickname}
                {isMe && <span className="text-[11px] text-primary-300 font-normal">(شما)</span>}
              </p>
              <p className="text-sm text-white/45">
                {entry.finished ? `${entry.moves} حرکت` : `${entry.progress}٪ تکمیل شده`}
              </p>
            </div>

            <div className="text-right shrink-0">
              {entry.finished && entry.finishTime !== null ? (
                <p className={clsx("font-mono font-bold text-lg", medal ? medal.text : "text-white/80")}>
                  {formatTime(entry.finishTime)}
                </p>
              ) : (
                <p className="text-sm text-white/40">در حال انجام</p>
              )}
            </div>
          </motion.div>
        );
      })}
      {entries.length === 0 && (
        <div className="text-center py-10 text-white/40">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">هنوز نتیجه‌ای ثبت نشده</p>
        </div>
      )}
    </div>
  );
}
