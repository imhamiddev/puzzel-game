"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DIFFICULTY_LIST, type DifficultyKey } from "@/lib/game/difficulty";
import clsx from "clsx";

interface DifficultySelectorProps {
  value: DifficultyKey;
  onChange: (key: DifficultyKey) => void;
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {DIFFICULTY_LIST.map((d) => {
        const active = d.key === value;
        return (
          <motion.button
            key={d.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(d.key)}
            className={clsx(
              "relative rounded-2xl p-4 text-left transition-colors",
              active ? "bg-primary-gradient shadow-glow-sm" : "glass hover:bg-white/[0.07]"
            )}
          >
            {active && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-white/25 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <p className={clsx("font-semibold", active ? "text-white" : "text-white/90")}>
              {d.label}
            </p>
            <p className={clsx("text-sm mt-0.5", active ? "text-white/80" : "text-white/45")}>
              {d.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
