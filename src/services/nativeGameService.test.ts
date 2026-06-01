import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultMiniGamesProgress } from "../game/miniGameProgress";
import { INITIAL_PLAYER, type PlayerState } from "../types";
import { createNativeGameLaunchOptions, parseNativeMiniGameError } from "./nativeGameService";

function makePlayer(): PlayerState {
  const miniGames = createDefaultMiniGamesProgress();
  miniGames["shadow-extraction"] = {
    ...miniGames["shadow-extraction"],
    bestScore: 7579,
    level: 24,
  };

  return {
    ...structuredClone(INITIAL_PLAYER),
    level: 27,
    xp: 881,
    gold: 13821,
    hp: 1680,
    maxHp: 1680,
    miniGames,
    settings: {
      ...INITIAL_PLAYER.settings,
      fpsOverlayEnabled: true,
      graphicsQuality: "cinematic",
    },
  };
}

test("native launch payload carries current player and mini-game state", () => {
  const payload = createNativeGameLaunchOptions("shadow-extraction", makePlayer());

  assert.deepEqual(payload, {
    gameId: "shadow-extraction",
    bestScore: 7579,
    gameLevel: 24,
    gold: 13821,
    hp: 1680,
    baseHp: 1680,
    playerLevel: 27,
    playerXp: 881,
    fpsOverlayEnabled: true,
    graphicsQuality: "cinematic",
    xpMultiplier: 1,
    scoreBonus: 0,
    targetLifetimeBonusMs: 0,
    hitWindowBonus: 0,
    timePenaltyResist: 0,
    selectedEffectId: "system-aura",
    selectedEffectName: "Aura Systemu",
    showGrid: false,
  });
});

test("native launch payload carries runtime shop and relic bonuses", () => {
  const payload = createNativeGameLaunchOptions("shadow-extraction", makePlayer(), {
    xpMultiplier: 1.25,
    scoreBonus: 0.12,
    targetLifetimeBonusMs: 420,
    hitWindowBonus: 0.09,
    timePenaltyResist: 0.14,
    selectedEffectId: "monarch-runes",
    selectedEffectName: "Runy Monarchii",
    showGrid: true,
  });

  assert.equal(payload.xpMultiplier, 1.25);
  assert.equal(payload.scoreBonus, 0.12);
  assert.equal(payload.targetLifetimeBonusMs, 420);
  assert.equal(payload.hitWindowBonus, 0.09);
  assert.equal(payload.timePenaltyResist, 0.14);
  assert.equal(payload.selectedEffectId, "monarch-runes");
  assert.equal(payload.selectedEffectName, "Runy Monarchii");
  assert.equal(payload.showGrid, true);
});

test("native game error parser accepts guarded Android failure payloads", () => {
  const parsed = parseNativeMiniGameError(JSON.stringify({
    id: "native_error_1",
    gameId: "shadow-extraction",
    stage: "initialize",
    message: "asset missing",
    type: "java.lang.IllegalStateException",
    gameLevel: 24,
    graphicsQuality: "balanced",
  }));

  assert.deepEqual(parsed, {
    id: "native_error_1",
    gameId: "shadow-extraction",
    stage: "initialize",
    message: "asset missing",
    type: "java.lang.IllegalStateException",
    gameLevel: 24,
    graphicsQuality: "balanced",
  });
});

test("native game error parser rejects malformed payloads", () => {
  assert.equal(parseNativeMiniGameError(null), null);
  assert.equal(parseNativeMiniGameError("{bad-json"), null);
  assert.equal(parseNativeMiniGameError(JSON.stringify({ gameId: "shadow-extraction" })), null);
});
