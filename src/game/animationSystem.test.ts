import test from "node:test";
import assert from "node:assert/strict";
import {
  createAnimationEvent,
  enqueueAnimationEvents,
  getActiveAnimationEvent,
  getActiveAnimationEventForActor,
  getActiveAnimationEvents,
  isAnimationLocked,
  pruneAnimationQueue,
} from "./animationSystem";

test("animation queue keeps events ordered and preserves blocking windows", () => {
  const first = createAnimationEvent("windup", "hunter", 0, { durationMs: 100, lockMs: 80 });
  const second = createAnimationEvent("attack", "hunter", 0, { durationMs: 140, lockMs: 120 });
  const queue = enqueueAnimationEvents([], [first, second], 0);

  assert.equal(queue.length, 2);
  assert.equal(queue[0].startedAt, 0);
  assert.equal(queue[1].startedAt, 100);
  assert.equal(isAnimationLocked(queue, 70), true);
  assert.equal(isAnimationLocked(queue, 90), true);
  assert.equal(isAnimationLocked(queue, 180), true);
  assert.equal(isAnimationLocked(queue, 230), false);
});

test("animation queue exposes current event and prunes finished events", () => {
  const event = createAnimationEvent("crit", "enemy", 10, { durationMs: 200, lockMs: 100 });
  const queue = enqueueAnimationEvents([], [event], 0);

  assert.equal(getActiveAnimationEvent(queue, 50)?.type, "crit");
  assert.equal(getActiveAnimationEvent(queue, 250), null);
  assert.equal(pruneAnimationQueue(queue, 250).length, 0);
});

test("animation queue resolves actor timelines independently", () => {
  const hunter = createAnimationEvent("attack", "hunter", 0, { durationMs: 700, lockMs: 320 });
  const enemy = createAnimationEvent("hit", "enemy", 120, { durationMs: 500, lockMs: 120 });
  const queue = enqueueAnimationEvents([], [hunter, enemy], 0);

  assert.equal(queue[0].startedAt, 0);
  assert.equal(queue[1].startedAt, 120);
  assert.equal(getActiveAnimationEventForActor(queue, 160, "hunter")?.type, "attack");
  assert.equal(getActiveAnimationEventForActor(queue, 160, "enemy")?.type, "hit");
  assert.equal(getActiveAnimationEvents(queue, 160).hunter?.type, "attack");
  assert.equal(getActiveAnimationEvents(queue, 160).enemy?.type, "hit");
});
