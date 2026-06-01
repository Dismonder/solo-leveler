import {
  createDefaultMiniGameProgress,
  getMiniGameLootChance,
  getMiniGameRewardMultiplier,
  type MiniGameId,
} from "./miniGameProgress";
import type { NativeMiniGameResult } from "../services/nativeGameService";
import type { Equipment, EquipmentSlotId, PlayerState } from "../types";

function rarityForLevel(level: number): Equipment["rarity"] {
  if (level >= 50) return "legendary";
  if (level >= 35) return "epic";
  if (level >= 15) return "rare";
  return "common";
}

function inferLootSlot(name: string): EquipmentSlotId {
  const normalized = name.toLocaleLowerCase("pl-PL");
  if (normalized.includes("helm") || normalized.includes("hełm") || normalized.includes("korona")) return "helmet";
  if (normalized.includes("rekawice") || normalized.includes("rękawice") || normalized.includes("karwasze")) return "gloves";
  if (normalized.includes("buty") || normalized.includes("nagolenniki")) return "boots";
  if (normalized.includes("pancerz") || normalized.includes("zbroja")) return "armor";
  if (normalized.includes("pierscien") || normalized.includes("pierścień")) return "ring1";
  if (normalized.includes("naszyjnik") || normalized.includes("amulet")) return "necklace";
  if (normalized.includes("ostrze") || normalized.includes("miecz") || normalized.includes("katana")) return "weapon";
  return "artifact";
}

function statForSlot(slot: EquipmentSlotId): keyof PlayerState["stats"] {
  if (slot === "weapon") return "STR";
  if (slot === "gloves" || slot === "boots") return "AGILITY";
  if (slot === "helmet" || slot === "armor") return "VITALITY";
  if (slot === "necklace" || slot === "ring1" || slot === "ring2") return "INTELLIGENCE";
  return "SENSE";
}

function createNativeLoot(result: NativeMiniGameResult, level: number): Equipment | null {
  if (!result.lootName) return null;

  const slot = inferLootSlot(result.lootName);
  return {
    id: `native_${result.id}`,
    name: result.lootName,
    type: slot,
    rarity: rarityForLevel(level),
    bonusType: statForSlot(slot),
    bonusValue: Math.max(1, Math.floor(level / 8) + 1),
    durability: 100,
    maxDurability: 100,
  };
}

export function applyNativeMiniGameSettlement(
  player: PlayerState,
  result: NativeMiniGameResult,
  today: string
): PlayerState {
  const gameId = result.gameId as MiniGameId;
  const currentProgress = player.miniGames[gameId] || createDefaultMiniGameProgress(gameId);
  const nextLevel = Math.max(1, Math.floor(result.nextGameLevel || currentProgress.level));
  const nextWinStreak = result.won ? currentProgress.winStreak + 1 : 0;
  const loot = createNativeLoot(result, nextLevel);

  return {
    ...player,
    level: Math.max(1, result.playerLevelAfter || player.level),
    xp: Math.max(0, result.playerXpAfter ?? player.xp),
    gold: Math.max(0, result.goldAfter ?? player.gold),
    hp: Math.max(0, Math.min(player.maxHp, result.hpAfter ?? player.hp)),
    inventory: loot ? [...player.inventory, loot] : player.inventory,
    dailyQuest: {
      ...player.dailyQuest,
      miniGamesPlayed: player.dailyQuest.miniGamesPlayed + 1,
    },
    miniGames: {
      ...player.miniGames,
      [gameId]: {
        ...currentProgress,
        level: nextLevel,
        wins: currentProgress.wins + (result.won ? 1 : 0),
        losses: currentProgress.losses + (result.won ? 0 : 1),
        bestScore: Math.max(currentProgress.bestScore, Math.floor(result.score || 0)),
        winStreak: nextWinStreak,
        lastPlayedDate: today,
        rewardMultiplier: getMiniGameRewardMultiplier(nextLevel, nextWinStreak),
        lootChance: getMiniGameLootChance(nextLevel, nextWinStreak),
      },
    },
  };
}
