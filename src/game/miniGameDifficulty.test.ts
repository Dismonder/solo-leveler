import assert from "node:assert/strict";
import test from "node:test";
import {
  getExtractionSignalWindowMs,
  getMemoryStepMs,
  getMiniGameDifficulty,
  getRuneLockWindowMs,
  getStrikeWindow,
  getStrikeZoneWidth,
} from "./miniGameDifficulty";

test("mini-game difficulty rises with score and level", () => {
  assert.ok(getMiniGameDifficulty(900, 12) > getMiniGameDifficulty(0, 1));
  assert.ok(getStrikeZoneWidth(900, 12) < getStrikeZoneWidth(0, 1));
  assert.ok(getMemoryStepMs(900, 12) < getMemoryStepMs(0, 1));
  assert.ok(getRuneLockWindowMs(900, 12) < getRuneLockWindowMs(0, 1));
  assert.ok(getExtractionSignalWindowMs(900, 12) < getExtractionSignalWindowMs(0, 1));
});

test("strike window exposes matching visual and hitbox bounds", () => {
  const window = getStrikeWindow(50, 20);

  assert.equal(window.left, 40);
  assert.equal(window.right, 60);
  assert.ok(window.perfectLeft > window.left);
  assert.ok(window.perfectRight < window.right);
});
