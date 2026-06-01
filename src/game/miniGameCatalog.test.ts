import assert from "node:assert/strict";
import test from "node:test";
import { MINI_GAME_CATALOG, canUseMiniGameRank, getMiniGameDefinition } from "./miniGameCatalog";

test("mini-game catalog unlocks games by hunter rank", () => {
  assert.equal(MINI_GAME_CATALOG.length, 5);
  assert.equal(getMiniGameDefinition("gate-dodge").requiredRank, "E");
  assert.equal(getMiniGameDefinition("mana-memory").requiredRank, "D");
  assert.equal(getMiniGameDefinition("shadow-strike").requiredRank, "C");
  assert.equal(getMiniGameDefinition("rune-lock").requiredRank, "B");
  assert.equal(getMiniGameDefinition("shadow-extraction").requiredRank, "A");

  assert.equal(canUseMiniGameRank("E", "D"), false);
  assert.equal(canUseMiniGameRank("D", "D"), true);
  assert.equal(canUseMiniGameRank("A", "B"), true);
  assert.equal(canUseMiniGameRank("S", "A"), true);
});
