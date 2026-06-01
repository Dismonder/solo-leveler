import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultMiniGamesProgress } from "../game/miniGameProgress";
import { INITIAL_PLAYER, type PlayerState } from "../types";
import { createNativeGameLaunchOptions } from "./nativeGameService";

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
  });
});
