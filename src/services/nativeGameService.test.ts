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
  });
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
