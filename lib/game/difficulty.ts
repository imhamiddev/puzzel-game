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
    label: "Easy",
    rows: 3,
    cols: 3,
    pieces: 9,
    description: "3 × 3 — 9 pieces",
  },
  MEDIUM: {
    key: "MEDIUM",
    label: "Medium",
    rows: 4,
    cols: 4,
    pieces: 16,
    description: "4 × 4 — 16 pieces",
  },
  HARD: {
    key: "HARD",
    label: "Hard",
    rows: 6,
    cols: 6,
    pieces: 36,
    description: "6 × 6 — 36 pieces",
  },
  EXPERT: {
    key: "EXPERT",
    label: "Expert",
    rows: 8,
    cols: 8,
    pieces: 64,
    description: "8 × 8 — 64 pieces",
  },
};

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
