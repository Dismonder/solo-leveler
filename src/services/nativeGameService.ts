import { Capacitor, registerPlugin } from "@capacitor/core";
import type { MiniGameId } from "../game/miniGameProgress";
import type { PlayerState } from "../types";

export type NativeGameLaunchOptions = {
  gameId: MiniGameId;
  bestScore?: number;
  gameLevel?: number;
  gold?: number;
  hp?: number;
  baseHp?: number;
  playerLevel?: number;
  playerXp?: number;
  fpsOverlayEnabled?: boolean;
  graphicsQuality?: PlayerState["settings"]["graphicsQuality"];
};

type HunterNativeGamePlugin = {
  isAvailable: () => Promise<{ available: boolean; engine?: string; runtime?: string }>;
  launch: (options: NativeGameLaunchOptions) => Promise<{ launched: boolean; gameId: MiniGameId; engine?: string }>;
  consumeLastResult: () => Promise<{ resultJson: string | null }>;
};

export type NativeMiniGameResult = {
  id: string;
  gameId: MiniGameId;
  score: number;
  won: boolean;
  previousBest: number;
  newBest: boolean;
  previousGameLevel: number;
  nextGameLevel: number;
  xpReward: number;
  goldReward: number;
  lootName: string;
  hpBefore: number;
  hpAfter: number;
  hpLoss: number;
  hpRestored: number;
  playerLevelBefore: number;
  playerLevelAfter: number;
  playerXpBefore: number;
  playerXpAfter: number;
  goldBefore: number;
  goldAfter: number;
  difficultyLevel: number;
  rewardMultiplier: number;
  penaltyApplied: boolean;
  fpsLast?: number;
  fpsAverage?: number;
  fpsMin?: number;
  frameMs?: number;
  graphicsQuality?: PlayerState["settings"]["graphicsQuality"];
};

const HunterNativeGame = registerPlugin<HunterNativeGamePlugin>("HunterNativeGame");

export function isNativeGameRuntimeAvailable() {
  return Capacitor.getPlatform() === "android";
}

export function createNativeGameLaunchOptions(gameId: MiniGameId, player: PlayerState): NativeGameLaunchOptions {
  const progress = player.miniGames?.[gameId];
  return {
    gameId,
    bestScore: progress?.bestScore ?? 0,
    gameLevel: progress?.level ?? 1,
    gold: player.gold,
    hp: player.hp,
    baseHp: player.maxHp,
    playerLevel: player.level,
    playerXp: player.xp,
    fpsOverlayEnabled: Boolean(player.settings.fpsOverlayEnabled),
    graphicsQuality: player.settings.graphicsQuality ?? "balanced",
  };
}

export async function launchNativeMiniGame(gameId: MiniGameId, player: PlayerState) {
  if (!isNativeGameRuntimeAvailable() || gameId !== "shadow-extraction") return false;

  try {
    const availability = await HunterNativeGame.isAvailable();
    if (!availability.available) return false;

    const launched = await HunterNativeGame.launch(createNativeGameLaunchOptions(gameId, player));
    return Boolean(launched.launched);
  } catch {
    return false;
  }
}

export async function consumeNativeMiniGameResult(): Promise<NativeMiniGameResult | null> {
  if (!isNativeGameRuntimeAvailable()) return null;

  try {
    const { resultJson } = await HunterNativeGame.consumeLastResult();
    if (!resultJson) return null;
    const parsed = JSON.parse(resultJson) as NativeMiniGameResult;
    return parsed?.gameId ? parsed : null;
  } catch {
    return null;
  }
}
