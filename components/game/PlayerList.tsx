"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, User } from "lucide-react";
import Card from "@/components/ui/Card";

export interface LobbyPlayer {
  id: string;
  nickname: string;
  isHost: boolean;
}

const medals = ["🥇", "🥈", "🥉"];

export default function PlayerList({ players }: { players: LobbyPlayer[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Players</h3>
        <span className="text-sm text-white/50">{players.length} joined</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        <AnimatePresence initial={false}>
          {players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3"
            >
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                {i < 3 ? medals[i] : <User className="h-4 w-4 text-white/60" />}
              </div>
              <p className="font-medium text-white flex-1 truncate">{p.nickname}</p>
              {p.isHost && (
                <span className="flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full">
                  <Crown className="h-3 w-3" /> Host
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {players.length === 0 && (
          <p className="text-center text-white/40 text-sm py-6">Waiting for players to join…</p>
        )}
      </div>
    </Card>
  );
}
