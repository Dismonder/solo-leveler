import { Capacitor, registerPlugin } from "@capacitor/core";
import type { MiniGameId } from "../game/miniGameProgress";
import type { PlayerState } from "../types";

type NativeGameLaunchOptions = {
  gameId: MiniGameId;
  bestScore?: number;
  gameLevel?: number;
  gold?: number;
  hp?: number;
  baseHp?: number;
  playerLevel?: number;
  playerXp?: number;
};

type HunterNativeGamePlugin = {
  isAvailable: () => Promise<{ available: boolean; engine?: string; runtime?: string }>;
  launch: (options: NativeGameLaunchOptions) => Promise<{ launched: boolean; gameId: MiniGameId; engine?: string }>;
};

const HunterNativeGame = registerPlugin<HunterNativeGamePlugin>("HunterNativeGame");

export function isNativeGameRuntimeAvailable() {
  return Capacitor.getPlatform() === "android";
}

export async function launchNativeMiniGame(gameId: MiniGameId, player: PlayerState) {
  if (!isNativeGameRuntimeAvailable() || gameId !== "shadow-extraction") return false;

  try {
    const availability = await HunterNativeGame.isAvailable();
    if (!availability.available) return false;

    const progress = player.miniGames?.[gameId];
    const launched = await HunterNativeGame.launch({
      gameId,
      bestScore: progress?.bestScore ?? 0,
      gameLevel: progress?.level ?? 1,
      gold: player.gold,
      hp: player.hp,
      baseHp: player.maxHp,
      playerLevel: player.level,
      playerXp: player.xp,
    });
    return Boolean(launched.launched);
  } catch {
    return false;
  }
}
