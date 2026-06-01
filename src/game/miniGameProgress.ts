import type { Equipment, EquipmentSlotId, MiniGameRelicPerk } from "../types";

export type MiniGameId =
  | "gate-dodge"
  | "shadow-strike"
  | "mana-memory"
  | "rune-lock"
  | "shadow-extraction";

export type MiniGameProgress = {
  id: MiniGameId;
  level: number;
  wins: number;
  losses: number;
  bestScore: number;
  winStreak: number;
  lastPlayedDate: string | null;
  rewardMultiplier: number;
  lootChance: number;
};

export type MiniGameCompletionInput = {
  gameId: MiniGameId;
  score: number;
  survivedSeconds?: number;
  won: boolean;
  statHint?: "STR" | "VITALITY" | "AGILITY" | "INTELLIGENCE" | "SENSE";
  hpRestored?: number;
  xpMultiplier?: number;
};

export type MiniGameCompletion = {
  progress: MiniGameProgress;
  xpReward: number;
  goldReward: number;
  loot: Equipment | null;
  difficultyLevel: number;
};

export const MINI_GAME_IDS: MiniGameId[] = [
  "gate-dodge",
  "shadow-strike",
  "mana-memory",
  "rune-lock",
  "shadow-extraction",
];

const BASE_XP: Record<MiniGameId, number> = {
  "gate-dodge": 90,
  "shadow-strike": 85,
  "mana-memory": 80,
  "rune-lock": 95,
  "shadow-extraction": 90,
};

const BASE_GOLD: Record<MiniGameId, number> = {
  "gate-dodge": 12,
  "shadow-strike": 14,
  "mana-memory": 10,
  "rune-lock": 16,
  "shadow-extraction": 15,
};

export function getMiniGameRewardMultiplier(level: number, winStreak: number) {
  return Number((1 + Math.max(0, level - 1) * 0.12 + Math.max(0, winStreak) * 0.03).toFixed(2));
}

export function getMiniGameLootChance(level: number, winStreak: number) {
  return Math.min(0.45, Number((0.05 + Math.max(0, level - 1) * 0.008 + Math.max(0, winStreak) * 0.01).toFixed(3)));
}

export function createDefaultMiniGameProgress(id: MiniGameId): MiniGameProgress {
  return {
    id,
    level: 1,
    wins: 0,
    losses: 0,
    bestScore: 0,
    winStreak: 0,
    lastPlayedDate: null,
    rewardMultiplier: getMiniGameRewardMultiplier(1, 0),
    lootChance: getMiniGameLootChance(1, 0),
  };
}

export function createDefaultMiniGamesProgress() {
  return MINI_GAME_IDS.reduce(
    (acc, id) => {
      acc[id] = createDefaultMiniGameProgress(id);
      return acc;
    },
    {} as Record<MiniGameId, MiniGameProgress>
  );
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetween(from: string, to: string) {
  return Math.max(0, Math.floor((parseDateKey(to) - parseDateKey(from)) / 86_400_000));
}

function withDerivedProgress(progress: MiniGameProgress): MiniGameProgress {
  return {
    ...progress,
    level: Math.max(1, Math.floor(progress.level || 1)),
    wins: Math.max(0, Math.floor(progress.wins || 0)),
    losses: Math.max(0, Math.floor(progress.losses || 0)),
    bestScore: Math.max(0, Math.floor(progress.bestScore || 0)),
    winStreak: Math.max(0, Math.floor(progress.winStreak || 0)),
    rewardMultiplier: getMiniGameRewardMultiplier(progress.level || 1, progress.winStreak || 0),
    lootChance: getMiniGameLootChance(progress.level || 1, progress.winStreak || 0),
  };
}

export function normalizeMiniGameProgress(progress: Partial<MiniGameProgress> | undefined, id: MiniGameId) {
  return withDerivedProgress({
    ...createDefaultMiniGameProgress(id),
    ...(progress || {}),
    id,
  });
}

export function normalizeMiniGamesProgress(progress?: Partial<Record<MiniGameId, Partial<MiniGameProgress>>>) {
  return MINI_GAME_IDS.reduce(
    (acc, id) => {
      acc[id] = normalizeMiniGameProgress(progress?.[id], id);
      return acc;
    },
    {} as Record<MiniGameId, MiniGameProgress>
  );
}

export function applyMiniGameDecay(progress: MiniGameProgress, today: string) {
  if (!progress.lastPlayedDate) return withDerivedProgress(progress);

  const idleDays = daysBetween(progress.lastPlayedDate, today);
  if (idleDays < 2) return withDerivedProgress(progress);

  const levelDrop = Math.floor(idleDays / 2);
  return withDerivedProgress({
    ...progress,
    level: Math.max(1, progress.level - levelDrop),
    winStreak: 0,
  });
}

function createMiniGameLoot(gameId: MiniGameId, level: number, statHint?: MiniGameCompletionInput["statHint"]): Equipment {
  const rankName = level >= 70 ? "SS" : level >= 50 ? "S" : level >= 35 ? "A" : level >= 20 ? "B" : level >= 10 ? "C" : level >= 5 ? "D" : "E";
  const rarity = level >= 50 ? "legendary" : level >= 35 ? "epic" : level >= 15 ? "rare" : "common";
  const bonusType = statHint || "SENSE";
  const type = getMiniGameLootType(gameId, level);

  return {
    id: `loot_${gameId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `${getMiniGameLootName(type, gameId)} ${rankName}`,
    type,
    rarity,
    bonusType,
    bonusValue: Math.max(1, Math.floor(level / 8) + 1),
    durability: 100,
    maxDurability: 100,
    miniGamePerk: createMiniGameRelicPerk(type, gameId, rarity),
  };
}

function createMiniGameRelicPerk(
  type: EquipmentSlotId,
  gameId: MiniGameId,
  rarity: NonNullable<Equipment["rarity"]>
): MiniGameRelicPerk | undefined {
  if (type !== "artifact" || rarity === "common") return undefined;

  const kindByGame: Record<MiniGameId, MiniGameRelicPerk["kind"]> = {
    "gate-dodge": "targetLifetime",
    "shadow-strike": "hitWindow",
    "mana-memory": "hitWindow",
    "rune-lock": "hitWindow",
    "shadow-extraction": "targetLifetime",
  };
  const rarityValue = {
    rare: 0.04,
    epic: 0.07,
    legendary: 0.1,
    common: 0,
  }[rarity];
  const kind = kindByGame[gameId];
  const value = kind === "targetLifetime"
    ? { rare: 120, epic: 190, legendary: 250, common: 0 }[rarity]
    : rarityValue;

  return {
    gameId,
    kind,
    value,
  };
}

function getMiniGameLootType(gameId: MiniGameId, level: number): EquipmentSlotId {
  const pool: Record<MiniGameId, EquipmentSlotId[]> = {
    "gate-dodge": ["boots", "ring1", "ring2", "artifact"],
    "shadow-strike": ["weapon", "gloves", "ring1", "artifact"],
    "mana-memory": ["helmet", "necklace", "artifact"],
    "rune-lock": ["helmet", "armor", "necklace", "artifact"],
    "shadow-extraction": ["weapon", "gloves", "necklace", "artifact"],
  };
  const options = pool[gameId] || ["artifact"];
  return options[level % options.length];
}

function getMiniGameLootName(type: EquipmentSlotId, gameId: MiniGameId): string {
  const prefix = gameId === "shadow-extraction" ? "Cienia" : gameId === "rune-lock" ? "Runiczny" : gameId === "mana-memory" ? "Many" : "Bramy";
  const names: Record<EquipmentSlotId, string> = {
    weapon: `Ostrze ${prefix}`,
    helmet: `Hełm ${prefix}`,
    armor: `Pancerz ${prefix}`,
    gloves: `Rękawice ${prefix}`,
    boots: `Buty ${prefix}`,
    ring1: `Pierścień ${prefix}`,
    ring2: `Pierścień ${prefix}`,
    necklace: `Naszyjnik ${prefix}`,
    artifact: `Rdzeń ${prefix}`,
  };
  return names[type];
}

export function calculateMiniGameCompletion({
  progress,
  result,
  today,
}: {
  progress: MiniGameProgress;
  result: MiniGameCompletionInput;
  today: string;
}): MiniGameCompletion {
  const decayed = applyMiniGameDecay(progress, today);
  const nextLevel = result.won ? decayed.level + 1 : decayed.level;
  const nextStreak = result.won ? decayed.winStreak + 1 : 0;
  const updatedProgress = withDerivedProgress({
    ...decayed,
    level: nextLevel,
    wins: decayed.wins + (result.won ? 1 : 0),
    losses: decayed.losses + (result.won ? 0 : 1),
    bestScore: Math.max(decayed.bestScore, Math.floor(result.score || 0)),
    winStreak: nextStreak,
    lastPlayedDate: today,
  });

  const rewardLevel = result.won ? nextLevel : decayed.level;
  const rewardStreak = result.won ? nextStreak : decayed.winStreak;
  const multiplier = result.won ? getMiniGameRewardMultiplier(rewardLevel, rewardStreak) : 0.35;
  const scoreBonus = Math.min(150, Math.floor((result.score || 0) / 10));
  const survivalBonus = Math.floor((result.survivedSeconds || 0) * 1.5);
  const xpReward = Math.max(5, Math.floor((BASE_XP[result.gameId] + scoreBonus + survivalBonus) * multiplier));
  const goldReward = result.won ? Math.max(1, Math.floor((BASE_GOLD[result.gameId] + rewardLevel * 2) * multiplier)) : Math.floor(rewardLevel / 2);
  const lootChance = result.won ? getMiniGameLootChance(rewardLevel, decayed.winStreak) : 0;
  const loot = lootChance > 0 && Math.random() < lootChance ? createMiniGameLoot(result.gameId, rewardLevel, result.statHint) : null;

  return {
    progress: updatedProgress,
    xpReward,
    goldReward,
    loot,
    difficultyLevel: decayed.level,
  };
}
