import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceShadowStrikeMotion,
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

test("advanceShadowStrikeMotion smoothly advances position and angle without phase teleportation", () => {
  const initial = {
    cursorPosition: 30,
    driftAngle: Math.PI / 4,
    deltaSeconds: 0.016,
    cycleMs: 1120,
    driftMs: 850,
    difficulty: 0,
  };

  const step1 = advanceShadowStrikeMotion(initial);
  assert.ok(step1.nextCursor > 30);
  assert.ok(step1.nextAngle > Math.PI / 4);

  // When score rises on strike, difficulty increases by 1 tier (cycle and drift speed up)
  const step2 = advanceShadowStrikeMotion({
    cursorPosition: step1.nextCursor,
    driftAngle: step1.nextAngle,
    deltaSeconds: 0.016,
    cycleMs: 1055, // difficulty 1: faster cycle
    driftMs: 815, // difficulty 1: faster drift
    difficulty: 1,
  });

  // Check continuity: delta in zone between consecutive frames should be smooth (< 2%)
  const zoneDelta = Math.abs(step2.nextZone - step1.nextZone);
  assert.ok(zoneDelta < 2, `Zone delta was ${zoneDelta}, expected smooth transition`);

  // Cursor delta between consecutive frames should also be small (< 5%)
  const cursorDelta = Math.abs(step2.nextCursor - step1.nextCursor);
  assert.ok(cursorDelta < 5, `Cursor delta was ${cursorDelta}, expected smooth transition`);
});

