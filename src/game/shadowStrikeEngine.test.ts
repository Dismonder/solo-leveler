import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceShadowStrike,
  createShadowStrikeConfig,
  createShadowStrikeRuntime,
  getShadowStrikeSnapshot,
  pauseShadowStrike,
  resumeShadowStrike,
  tryShadowStrike,
} from "./shadowStrikeEngine";

test("shadow strike config keeps readable hard limits", () => {
  const config = createShadowStrikeConfig(99, 0, 0, 0);
  assert.ok(config.hitWindowWidth >= 16);
  assert.ok(config.oneWayMs >= 850);
  assert.equal(config.inputCooldownMs, 100);
  assert.equal(config.missPenaltyMs, 1000);
});

test("cursor reflects at both edges without teleporting", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  let previous = runtime.cursorPosition;
  for (let now = 8; now <= 6000; now += 8) {
    advanceShadowStrike(runtime, now);
    assert.ok(runtime.cursorPosition >= 0 && runtime.cursorPosition <= 100);
    assert.ok(Math.abs(runtime.cursorPosition - previous) < 2);
    previous = runtime.cursorPosition;
  }
});

test("one physical contact cannot score twice", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  const first = tryShadowStrike(runtime, 500);
  const duplicate = tryShadowStrike(runtime, 540);
  assert.equal(first?.tier, "perfect");
  assert.equal(duplicate, null);
  assert.equal(runtime.acceptedInputs, 1);
});

test("fixed target classifies perfect, great, good and miss", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const positions = [50, 55, 60, 90] as const;
  const expected = ["perfect", "great", "good", "miss"] as const;
  positions.forEach((position, index) => {
    const runtime = createShadowStrikeRuntime(0, config);
    runtime.lastAdvancedAtMs = 500;
    runtime.cursorPosition = position;
    assert.equal(tryShadowStrike(runtime, 500)?.tier, expected[index]);
  });
});

test("cursor position depends on active time rather than frame schedule", () => {
  const config = createShadowStrikeConfig(8, 0, 0, 0);
  const sixty = createShadowStrikeRuntime(0, config);
  const oneTwenty = createShadowStrikeRuntime(0, config);
  for (let now = 1000 / 60; now < 1000; now += 1000 / 60) advanceShadowStrike(sixty, now);
  for (let now = 1000 / 120; now < 1000; now += 1000 / 120) advanceShadowStrike(oneTwenty, now);
  advanceShadowStrike(sixty, 1000);
  advanceShadowStrike(oneTwenty, 1000);
  assert.ok(Math.abs(sixty.cursorPosition - oneTwenty.cursorPosition) < 0.0001);
});

test("time bonus is capped and miss costs at most one second", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);
  runtime.remainingMs = 41_900;
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  tryShadowStrike(runtime, 500);
  assert.equal(runtime.remainingMs, 42_000);
  runtime.cursorPosition = 0;
  runtime.lastAdvancedAtMs = 700;
  const beforeMiss = runtime.remainingMs;
  tryShadowStrike(runtime, 700);
  assert.ok(beforeMiss - runtime.remainingMs <= 1000);
});

test("pause freezes both cursor and remaining time", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  advanceShadowStrike(runtime, 300);
  pauseShadowStrike(runtime, 300);
  const frozen = getShadowStrikeSnapshot(runtime);
  advanceShadowStrike(runtime, 5300);
  assert.deepEqual(getShadowStrikeSnapshot(runtime), frozen);
  resumeShadowStrike(runtime, 5300);
  advanceShadowStrike(runtime, 5400);
  assert.ok(runtime.remainingMs < frozen.remainingMs);
});

test("finished round remains terminal", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  runtime.remainingMs = 10;
  advanceShadowStrike(runtime, 20);
  assert.equal(runtime.finished, true);
  const snapshot = getShadowStrikeSnapshot(runtime);
  advanceShadowStrike(runtime, 2000);
  assert.deepEqual(getShadowStrikeSnapshot(runtime), snapshot);
  assert.equal(tryShadowStrike(runtime, 2100), null);
});
