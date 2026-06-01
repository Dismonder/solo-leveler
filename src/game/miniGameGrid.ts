import type { MiniGameId } from "./miniGameProgress";

export type MiniGameGridSettings = Partial<Record<MiniGameId, boolean>>;

const MINI_GAME_IDS: MiniGameId[] = ["gate-dodge", "shadow-strike", "mana-memory", "rune-lock", "shadow-extraction"];

export const DEFAULT_MINI_GAME_GRID_SETTINGS: MiniGameGridSettings = {
  "shadow-extraction": false,
};

export function normalizeMiniGameGridSettings(input: unknown): MiniGameGridSettings {
  const result: MiniGameGridSettings = { ...DEFAULT_MINI_GAME_GRID_SETTINGS };
  if (!input || typeof input !== "object") return result;

  const source = input as Partial<Record<MiniGameId, unknown>>;
  for (const gameId of MINI_GAME_IDS) {
    if (typeof source[gameId] === "boolean") result[gameId] = source[gameId];
  }
  return result;
}

export function isMiniGameGridEnabled(settings: unknown, gameId: MiniGameId) {
  const normalized = normalizeMiniGameGridSettings(settings);
  return normalized[gameId] ?? true;
}
