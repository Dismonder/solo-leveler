import assert from "node:assert/strict";
import test from "node:test";
import { MINI_GAME_CATALOG, canUseMiniGameRank, getMiniGameDefinition } from "./miniGameCatalog";
import { MINI_GAME_IDS, normalizeMiniGamesProgress } from "./miniGameProgress";

test("mini-game catalog unlocks games by hunter rank", () => {
  assert.equal(MINI_GAME_CATALOG.length, 6);
  assert.equal(getMiniGameDefinition("gate-dodge").requiredRank, "E");
  assert.equal(getMiniGameDefinition("mana-memory").requiredRank, "D");
  assert.equal(getMiniGameDefinition("shadow-strike").requiredRank, "C");
  assert.equal(getMiniGameDefinition("rune-lock").requiredRank, "B");
  assert.equal(getMiniGameDefinition("shadow-extraction").requiredRank, "A");
  assert.equal(getMiniGameDefinition("idle-rpg").requiredRank, "S");

  assert.equal(canUseMiniGameRank("E", "D"), false);
  assert.equal(canUseMiniGameRank("D", "D"), true);
  assert.equal(canUseMiniGameRank("A", "B"), true);
  assert.equal(canUseMiniGameRank("S", "A"), true);
  assert.equal(canUseMiniGameRank("S", "S"), true);
});

test("isolated Idle RPG is launchable but never enters persisted main-profile progress", () => {
  assert.equal(MINI_GAME_CATALOG.some((game) => game.id === "idle-rpg"), true);
  assert.equal(MINI_GAME_IDS.includes("idle-rpg" as never), false);

  const normalized = normalizeMiniGamesProgress({
    ...Object.fromEntries(MINI_GAME_IDS.map((id) => [id, { id }])),
    "idle-rpg": { id: "idle-rpg", level: 99 },
  } as never);

  assert.equal(Object.prototype.hasOwnProperty.call(normalized, "idle-rpg"), false);
});
