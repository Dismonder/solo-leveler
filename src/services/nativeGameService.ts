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
  xpMultiplier?: number;
  scoreBonus?: number;
  targetLifetimeBonusMs?: number;
  hitWindowBonus?: number;
  timePenaltyResist?: number;
  selectedEffectId?: string;
  selectedEffectName?: string;
  showGrid?: boolean;
  autoStart?: boolean;
};

export type NativeGameRuntimeBonuses = Pick<
  NativeGameLaunchOptions,
  | "xpMultiplier"
  | "scoreBonus"
  | "targetLifetimeBonusMs"
  | "hitWindowBonus"
  | "timePenaltyResist"
  | "selectedEffectId"
  | "selectedEffectName"
  | "showGrid"
  | "autoStart"
>;

type HunterNativeGamePlugin = {
  isAvailable: () => Promise<{ available: boolean; engine?: string; runtime?: string }>;
  launch: (options: NativeGameLaunchOptions) => Promise<{ launched: boolean; gameId: MiniGameId; engine?: string }>;
  consumeLastResult: () => Promise<{ resultJson: string | null }>;
  consumeLastError: () => Promise<{ errorJson: string | null }>;
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
  boosterApplied?: boolean;
  xpMultiplier?: number;
  scoreBonus?: number;
  targetLifetimeBonusMs?: number;
  hitWindowBonus?: number;
  timePenaltyResist?: number;
  selectedEffectId?: string;
  selectedEffectName?: string;
  fpsLast?: number;
  fpsAverage?: number;
  fpsMin?: number;
  frameMs?: number;
  graphicsQuality?: PlayerState["settings"]["graphicsQuality"];
};

export type NativeMiniGameError = {
  id?: string;
  gameId: MiniGameId;
  stage?: string;
  message: string;
  type?: string;
  gameLevel?: number;
  graphicsQuality?: PlayerState["settings"]["graphicsQuality"];
  timestamp?: number;
};

export function parseNativeMiniGameError(errorJson: string | null | undefined): NativeMiniGameError | null {
  if (!errorJson) return null;

  try {
    const parsed = JSON.parse(errorJson) as NativeMiniGameError;
    return parsed?.gameId && parsed?.message ? parsed : null;
  } catch {
    return null;
  }
}

const HunterNativeGame = registerPlugin<HunterNativeGamePlugin>("HunterNativeGame");

export function isNativeGameRuntimeAvailable() {
  return Capacitor.getPlatform() === "android";
}

export function createNativeGameLaunchOptions(
  gameId: MiniGameId,
  player: PlayerState,
  runtime: NativeGameRuntimeBonuses = {}
): NativeGameLaunchOptions {
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
    xpMultiplier: runtime.xpMultiplier ?? 1,
    scoreBonus: runtime.scoreBonus ?? 0,
    targetLifetimeBonusMs: runtime.targetLifetimeBonusMs ?? 0,
    hitWindowBonus: runtime.hitWindowBonus ?? 0,
    timePenaltyResist: runtime.timePenaltyResist ?? 0,
    selectedEffectId: runtime.selectedEffectId ?? "system-aura",
    selectedEffectName: runtime.selectedEffectName ?? "Aura Systemu",
    showGrid: Boolean(runtime.showGrid),
    autoStart: runtime.autoStart ?? true,
  };
}

export async function launchNativeMiniGame(gameId: MiniGameId, player: PlayerState, runtime?: NativeGameRuntimeBonuses) {
  if (!isNativeGameRuntimeAvailable() || gameId !== "shadow-extraction") return false;

  try {
    const availability = await HunterNativeGame.isAvailable();
    if (!availability.available) return false;

    const launched = await HunterNativeGame.launch(createNativeGameLaunchOptions(gameId, player, runtime));
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

export async function consumeNativeMiniGameError(): Promise<NativeMiniGameError | null> {
  if (!isNativeGameRuntimeAvailable()) return null;

  try {
    const { errorJson } = await HunterNativeGame.consumeLastError();
    return parseNativeMiniGameError(errorJson);
  } catch {
    return null;
  }
}
