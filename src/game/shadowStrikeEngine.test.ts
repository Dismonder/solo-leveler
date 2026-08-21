import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceShadowStrike,
  createShadowStrikeConfig,
  createShadowStrikeInteractionController,
  createShadowStrikeRuntime,
  getShadowStrikeDifficulty,
  getShadowStrikeHitWindows,
  getShadowStrikeSnapshot,
  getShadowStrikeTargetCenter,
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

test("the active input controller accepts one primary pointerdown but rejects its click and non-primary contacts", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  const controller = createShadowStrikeInteractionController();
  controller.activate(runtime);

  const pointerDown = controller.handleInput(
    runtime,
    { eventType: "pointerdown", isPrimary: true, pointerType: "touch", button: 0 },
    500,
  );
  assert.equal(pointerDown.consume, true);
  assert.equal(pointerDown.outcome?.tier, "perfect");
  assert.equal(runtime.acceptedInputs, 1);

  const synthesizedClick = controller.handleInput(
    runtime,
    { eventType: "click", isPrimary: true, pointerType: "mouse", button: 0 },
    700,
  );
  const nonPrimaryTouch = controller.handleInput(
    runtime,
    { eventType: "pointerdown", isPrimary: false, pointerType: "touch", button: 0 },
    900,
  );
  const secondaryMouseButton = controller.handleInput(
    runtime,
    { eventType: "pointerdown", isPrimary: true, pointerType: "mouse", button: 2 },
    1_100,
  );

  assert.deepEqual(synthesizedClick, { consume: false, outcome: null });
  assert.deepEqual(nonPrimaryTouch, { consume: false, outcome: null });
  assert.deepEqual(secondaryMouseButton, { consume: false, outcome: null });
  assert.equal(runtime.acceptedInputs, 1);
});

test("the active completion gate accepts its runtime once and rejects stale runtime identities", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const firstRuntime = createShadowStrikeRuntime(0, config);
  const nextRuntime = createShadowStrikeRuntime(1_000, config);
  const controller = createShadowStrikeInteractionController();
  controller.activate(firstRuntime);

  assert.equal(controller.claimCompletion(firstRuntime), true);
  assert.equal(controller.claimCompletion(firstRuntime), false);

  controller.activate(nextRuntime);
  assert.equal(controller.claimCompletion(firstRuntime), false);
  assert.equal(controller.claimCompletion(nextRuntime), true);
  assert.equal(controller.claimCompletion(nextRuntime), false);
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

test("pausing at or after the deadline transitions the runtime to terminal", () => {
  for (const pauseAtMs of [30_000, 30_001]) {
    const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
    pauseShadowStrike(runtime, pauseAtMs);
    assert.equal(runtime.finished, true);
    assert.equal(runtime.paused, false);
    assert.equal(runtime.remainingMs, 0);
  }
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

test("shadow strike progressively accelerates and increases difficulty with score and combo", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);

  const initialSnapshot = getShadowStrikeSnapshot(runtime);
  assert.equal(initialSnapshot.speedMultiplier, 1);
  assert.equal(initialSnapshot.difficultyTier, 1);

  // Advance cursor and strike perfect multiple times
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  tryShadowStrike(runtime, 500);

  assert.equal(runtime.combo, 1);
  assert.ok(runtime.score > 0);

  const snapshotAfterOne = getShadowStrikeSnapshot(runtime);
  assert.ok(snapshotAfterOne.currentOneWayMs <= initialSnapshot.currentOneWayMs);

  // Simulate high score and high combo
  runtime.score = 950;
  runtime.combo = 12;
  const highTierSnapshot = getShadowStrikeSnapshot(runtime);

  assert.ok(highTierSnapshot.currentOneWayMs < initialSnapshot.currentOneWayMs);
  assert.ok(highTierSnapshot.speedMultiplier > 1.3);
  assert.ok(highTierSnapshot.difficultyTier > initialSnapshot.difficultyTier);

  // Verify cursor moves faster per delta time under high score/combo
  const slowRuntime = createShadowStrikeRuntime(0, config);
  const fastRuntime = createShadowStrikeRuntime(0, config);
  fastRuntime.score = 950;
  fastRuntime.combo = 12;

  advanceShadowStrike(slowRuntime, 300);
  advanceShadowStrike(fastRuntime, 300);

  assert.ok(fastRuntime.cursorPosition > slowRuntime.cursorPosition);
});

test("missing a strike resets combo and restores baseline speed for current score", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);
  runtime.score = 600;
  runtime.combo = 15;

  const speedBeforeMiss = getShadowStrikeSnapshot(runtime).currentOneWayMs;

  runtime.cursorPosition = 0; // Miss position
  runtime.lastAdvancedAtMs = 200;
  const outcome = tryShadowStrike(runtime, 200);

  assert.equal(outcome?.tier, "miss");
  assert.equal(runtime.combo, 0);

  const speedAfterMiss = getShadowStrikeSnapshot(runtime).currentOneWayMs;
  // After losing combo burst, oneWayMs increases (speed relaxes slightly)
  assert.ok(speedAfterMiss > speedBeforeMiss);
});

test("consecutive perfect hits progressively shrink target hit window and award precision bonus", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);

  const initialWindows = getShadowStrikeHitWindows(0, 0, 1, 0, 0);
  const streak3Windows = getShadowStrikeHitWindows(0, 0, 1, 0, 3);
  const streak6Windows = getShadowStrikeHitWindows(0, 0, 1, 0, 6);

  // Perfect streak must progressively narrow the hit window and sweet spot
  assert.ok(streak3Windows.hitWindowWidth < initialWindows.hitWindowWidth);
  assert.ok(streak3Windows.perfectWindowWidth < initialWindows.perfectWindowWidth);
  assert.ok(streak6Windows.perfectWindowWidth < streak3Windows.perfectWindowWidth);

  // 1st Perfect Hit
  runtime.cursorPosition = 50;
  runtime.lastAdvancedAtMs = 100;
  const outcome1 = tryShadowStrike(runtime, 100);
  assert.equal(outcome1?.tier, "perfect");
  assert.equal(outcome1?.perfectStreak, 1);
  const gain1 = outcome1?.gain ?? 0;

  // 2nd Consecutive Perfect Hit (narrower target window, higher reward)
  runtime.cursorPosition = 50;
  runtime.lastAdvancedAtMs = 300;
  const outcome2 = tryShadowStrike(runtime, 300);
  assert.equal(outcome2?.tier, "perfect");
  assert.equal(outcome2?.perfectStreak, 2);
  const gain2 = outcome2?.gain ?? 0;

  // 3rd Consecutive Perfect Hit
  runtime.cursorPosition = 50;
  runtime.lastAdvancedAtMs = 500;
  const outcome3 = tryShadowStrike(runtime, 500);
  assert.equal(outcome3?.tier, "perfect");
  assert.equal(outcome3?.perfectStreak, 3);
  const gain3 = outcome3?.gain ?? 0;

  assert.ok(gain2 > gain1);
  assert.ok(gain3 > gain2);

  // Miss resets perfect streak to 0
  runtime.cursorPosition = 0;
  runtime.lastAdvancedAtMs = 700;
  const missOutcome = tryShadowStrike(runtime, 700);
  assert.equal(missOutcome?.tier, "miss");
  assert.equal(runtime.perfectStreak, 0);
});

test("target remains static at 50% for difficulty tier <= 15", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);
  runtime.score = 500; // diff = 3 + 0 = 3 (tier 4)
  runtime.activeElapsedMs = 1000;
  assert.equal(getShadowStrikeTargetCenter(runtime), 50);

  const snapshot = getShadowStrikeSnapshot(runtime);
  assert.equal(snapshot.isTargetMoving, false);
  assert.equal(snapshot.targetCenter, 50);
});

test("target dynamically oscillates and moves faster when difficulty tier > 15", () => {
  const config = createShadowStrikeConfig(60, 0, 0, 0); // level 60 => base diff = 15
  const runtime = createShadowStrikeRuntime(0, config);
  runtime.score = 650; // score diff = 5, total diff = 20 => difficulty tier 21 (> 15)

  const snapshot = getShadowStrikeSnapshot(runtime);
  assert.equal(snapshot.isTargetMoving, true);
  assert.ok(snapshot.difficultyTier > 15);

  const positions: number[] = [];
  for (let ms = 0; ms <= 2000; ms += 200) {
    runtime.activeElapsedMs = ms;
    positions.push(getShadowStrikeTargetCenter(runtime));
  }

  // Verify that the target has moved across multiple positions
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  assert.ok(minPos < 45, "Target should swing left of 45%");
  assert.ok(maxPos > 55, "Target should swing right of 55%");
  assert.ok(maxPos - minPos > 15, "Target oscillation range should be noticeable");

  // Verify that strike collision evaluates against the moving target position
  runtime.activeElapsedMs = 500;
  const movingCenter = getShadowStrikeTargetCenter(runtime);
  runtime.cursorPosition = movingCenter;
  runtime.lastAdvancedAtMs = 500;
  const directHit = tryShadowStrike(runtime, 500);
  assert.equal(directHit?.tier, "perfect");
});



