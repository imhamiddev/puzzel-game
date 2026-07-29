export type DifficultyKey = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  rows: number;
  cols: number;
  pieces: number;
  description: string;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  EASY: {
    key: "EASY",
    label: "ساده",
    rows: 3,
    cols: 3,
    pieces: 9,
    description: "۳ × ۳ — ۹ قطعه",
  },
  MEDIUM: {
    key: "MEDIUM",
    label: "متوسط",
    rows: 4,
    cols: 4,
    pieces: 16,
    description: "۴ × ۴ — ۱۶ قطعه",
  },
  HARD: {
    key: "HARD",
    label: "سخت",
    rows: 6,
    cols: 6,
    pieces: 36,
    description: "۶ × ۶ — ۳۶ قطعه",
  },
  EXPERT: {
    key: "EXPERT",
    label: "حرفه‌ای",
    rows: 8,
    cols: 8,
    pieces: 64,
    description: "۸ × ۸ — ۶۴ قطعه",
  },
};

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
