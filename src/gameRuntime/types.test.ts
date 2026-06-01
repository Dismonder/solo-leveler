import test from "node:test";
import assert from "node:assert/strict";
import { isTerminalGameRuntimeState, normalizeGameRuntimeSnapshot } from "./types";

test("runtime states expose terminal states", () => {
  assert.equal(isTerminalGameRuntimeState("finished"), true);
  assert.equal(isTerminalGameRuntimeState("destroyed"), true);
  assert.equal(isTerminalGameRuntimeState("running"), false);
  assert.equal(isTerminalGameRuntimeState("paused"), false);
});

test("snapshot normalization clamps negative values", () => {
  const snapshot = normalizeGameRuntimeSnapshot({
    state: "running",
    score: -20,
    combo: -5,
    remainingMs: -100,
    hpRestored: -10,
    hpLoss: -2,
  });

  assert.deepEqual(snapshot, {
    state: "running",
    score: 0,
    combo: 0,
    remainingMs: 0,
    hpRestored: 0,
    hpLoss: 0,
  });
});

test("snapshot normalization floors fractional runtime values", () => {
  const snapshot = normalizeGameRuntimeSnapshot({
    state: "running",
    score: 120.8,
    combo: 3.9,
    remainingMs: 1_234.99,
    hpRestored: 24.7,
  });

  assert.equal(snapshot.score, 120);
  assert.equal(snapshot.combo, 3);
  assert.equal(snapshot.remainingMs, 1234);
  assert.equal(snapshot.hpRestored, 24);
  assert.equal(snapshot.hpLoss, 0);
});

