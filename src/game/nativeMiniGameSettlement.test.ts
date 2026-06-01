import assert from "node:assert/strict";
import test from "node:test";
import { applyNativeMiniGameSettlement } from "./nativeMiniGameSettlement";
import { createDefaultMiniGamesProgress } from "./miniGameProgress";
import type { NativeMiniGameResult } from "../services/nativeGameService";
import { INITIAL_PLAYER, type PlayerState } from "../types";

function makePlayer(): PlayerState {
  return {
    ...structuredClone(INITIAL_PLAYER),
    name: "Eryk",
    level: 21,
    xp: 600,
    gold: 1200,
    hp: 1200,
    maxHp: 1480,
    inventory: [],
    miniGames: createDefaultMiniGamesProgress(),
    dailyQuest: {
      ...INITIAL_PLAYER.dailyQuest,
      miniGamesPlayed: 2,
    },
  };
}

function makeResult(overrides: Partial<NativeMiniGameResult> = {}): NativeMiniGameResult {
  return {
    id: "native-test",
    gameId: "shadow-extraction",
    score: 4100,
    won: true,
    previousBest: 1800,
    newBest: true,
    previousGameLevel: 14,
    nextGameLevel: 15,
    xpReward: 300,
    goldReward: 90,
    lootName: "Helm Cienia B",
    hpBefore: 1200,
    hpAfter: 1240,
    hpLoss: 0,
    hpRestored: 40,
    playerLevelBefore: 21,
    playerLevelAfter: 22,
    playerXpBefore: 600,
    playerXpAfter: 120,
    goldBefore: 1200,
    goldAfter: 1290,
    difficultyLevel: 14,
    rewardMultiplier: 2.68,
    penaltyApplied: false,
    ...overrides,
  };
}

test("native shadow extraction settlement updates player, progress and typed loot", () => {
  const next = applyNativeMiniGameSettlement(makePlayer(), makeResult(), "2026-06-01");
  const progress = next.miniGames["shadow-extraction"];

  assert.equal(next.level, 22);
  assert.equal(next.xp, 120);
  assert.equal(next.gold, 1290);
  assert.equal(next.hp, 1240);
  assert.equal(next.dailyQuest.miniGamesPlayed, 3);
  assert.equal(progress.level, 15);
  assert.equal(progress.wins, 1);
  assert.equal(progress.losses, 0);
  assert.equal(progress.bestScore, 4100);
  assert.equal(progress.lastPlayedDate, "2026-06-01");
  assert.equal(next.inventory.length, 1);
  assert.equal(next.inventory[0].type, "helmet");
  assert.equal(next.inventory[0].classificationSource, "explicit");
  assert.equal(next.inventory[0].bonusType, "VITALITY");
  assert.equal(next.inventory[0].rarity, "rare");
});

test("native settlement trusts explicit loot metadata over misleading item names", () => {
  const next = applyNativeMiniGameSettlement(
    makePlayer(),
    makeResult({
      lootName: "Relikt Cienia B",
      lootSlot: "helmet",
      lootRarity: "epic",
      lootBonusType: "VITALITY",
      lootBonusValue: 9,
    }),
    "2026-06-01"
  );

  assert.equal(next.inventory[0].type, "helmet");
  assert.equal(next.inventory[0].rarity, "epic");
  assert.equal(next.inventory[0].bonusType, "VITALITY");
  assert.equal(next.inventory[0].bonusValue, 9);
});

test("native settlement accepts explicit mini-game relic perks", () => {
  const next = applyNativeMiniGameSettlement(
    makePlayer(),
    makeResult({
      nextGameLevel: 35,
      lootName: "Rdzen Cienia A",
      lootSlot: "artifact",
      lootRarity: "epic",
      lootBonusType: "SENSE",
      lootBonusValue: 7,
      lootPerkGameId: "shadow-extraction",
      lootPerkKind: "targetLifetime",
      lootPerkValue: 190,
    }),
    "2026-06-01"
  );

  assert.equal(next.inventory[0].type, "artifact");
  assert.equal(next.inventory[0].miniGamePerk?.gameId, "shadow-extraction");
  assert.equal(next.inventory[0].miniGamePerk?.kind, "targetLifetime");
  assert.equal(next.inventory[0].miniGamePerk?.value, 190);
});

test("native settlement records losses without leveling the mini-game", () => {
  const next = applyNativeMiniGameSettlement(
    makePlayer(),
    makeResult({
      score: 320,
      won: false,
      newBest: false,
      nextGameLevel: 1,
      lootName: "",
      hpAfter: 1150,
      hpLoss: 50,
      hpRestored: 0,
      playerLevelAfter: 21,
      playerXpAfter: 720,
      goldAfter: 1205,
    }),
    "2026-06-01"
  );
  const progress = next.miniGames["shadow-extraction"];

  assert.equal(progress.level, 1);
  assert.equal(progress.wins, 0);
  assert.equal(progress.losses, 1);
  assert.equal(progress.winStreak, 0);
  assert.equal(next.hp, 1150);
  assert.equal(next.inventory.length, 0);
});
